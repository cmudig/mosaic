from functools import partial

import duckdb
import pyarrow as pa

from pkg.query import get_arrow, get_json, get_key, prepare


def test_key():
    assert (
        get_key("SELECT 1", "arrow")
        == "e004ebd5b5532a4b85984a62f8ad48a81aa3460c1ca07701f386135d72cdecf5.arrow"
    )


def test_query_json():
    con = duckdb.connect()

    assert partial(get_json, con)("SELECT 1 AS a") == '[{"a":1}]'


def test_query_arrow():
    con = duckdb.connect()

    my_schema = pa.schema([pa.field("a", pa.int32())])
    table = pa.Table.from_pylist([{"a": 1}], schema=my_schema)

    assert partial(get_arrow, con)("SELECT 1 AS a") == table


def test_prepared():
    con = duckdb.connect()

    my_schema = pa.schema([pa.field("foo", pa.int32())])
    table = pa.Table.from_pylist([{"foo": 3}], schema=my_schema)

    prepared_statements = {}
    params = [1, 2]

    sql = "SELECT ?+? AS foo"
    prepare(con, sql, params, prepared_statements)

    assert prepared_statements[sql] == 'EXECUTE "f7d5ef6aeca4caab0ff98217b7f6615fd87f1d592e5b201665f6e174de139309"({0},{1})'

    assert get_arrow(con, prepared_statements[sql], params) == table
