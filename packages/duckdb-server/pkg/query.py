import logging
from hashlib import sha256

import pyarrow as pa

logger = logging.getLogger(__name__)


def get_key(sql, command, params=None):
    string_to_be_hashed = sql + (",".join(list(map(str, params))) if params else "")
    return f"{sha256(string_to_be_hashed.encode('utf-8')).hexdigest()}.{command}"


def prepare(con, sql, params, prepared_statements):
    key = sha256(sql.encode("utf-8")).hexdigest()
    if (sql in prepared_statements):
        return
    prepare_sql = f'PREPARE "{key}" AS {sql}'
    con.execute(prepare_sql)
    placeholders = ','.join(f'{{{i}}}' for i in range(len(params)))
    prepared_statements[sql] = f'EXECUTE "{key}"({placeholders})'
    return


def retrieve(cache, query, get, prepared_statements):
    sql = query.get("sql")
    command = query.get("type")
    params = query.get("params")

    if params:
        sql = prepared_statements[sql]

    key = get_key(sql, command, params)
    result = cache.get(key)

    if result:
        logger.debug("Cache hit")
    else:
        result = get(sql, params)
        if query.get("persist", False):
            cache[key] = result
    return result


def get_arrow(con, sql, params=None):
    if params:
        return con.query(sql.format(*params)).arrow()
    return con.query(sql).arrow()


def arrow_to_bytes(arrow):
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, arrow.schema) as writer:
        writer.write(arrow)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con, sql, params=None):
    return arrow_to_bytes(get_arrow(con, sql, params=params))


def get_json(con, sql, params=None):
    if params:
        result = con.query(sql.format(*params)).df()
    else:
        result = con.query(sql).df()
    return result.to_json(orient="records")
