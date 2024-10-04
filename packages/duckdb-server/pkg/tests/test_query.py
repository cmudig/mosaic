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

    my_schema = pa.schema([pa.field("id", pa.int32()), pa.field("name", pa.string())])
    table = pa.Table.from_pylist([{"id": 1, "name": "Alice"}], schema=my_schema)

    con.register("arrow_table", table)  # Register the PyArrow table as "arrow_table"
    con.execute("CREATE TABLE users AS SELECT * FROM arrow_table")  # Create the DuckDB table from it

    sql = "SELECT id, name FROM users WHERE id = ?"

    prepared_statements = {}
    params = [1]

    prepare(con, sql, params, prepared_statements)

    assert prepared_statements[sql] == 'EXECUTE "49c45eb88d304ce5838538f26ae93ab0959ae624c02c6ffe1043f360c3014ea4"({0})'

    assert get_arrow(con, prepared_statements[sql], params) == table
