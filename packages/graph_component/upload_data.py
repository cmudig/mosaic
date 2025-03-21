import requests
import json
from datetime import datetime
nodes = [
    {"id": "1", "name": "Node 1", "size": 1, "color": "#ff0000", "value": 1},
    {"id": "2", "name": "Node 2", "size": 2, "color": "#00ff00", "value": 2},
    {"id": "3", "name": "Node 3", "size": 1.5, "color": "#0000ff", "value": 1.5},
    {"id": "4", "name": "Node 4", "size": 2.5, "color": "#ffff00", "value": 2.5},
    {"id": "5", "name": "Node 5", "size": 1.8, "color": "#ff00ff", "value": 1.8},
    {"id": "6", "name": "Node 6", "size": 1.2, "color": "#00ffff", "value": 1.2},
    {"id": "7", "name": "Node 7", "size": 2.2, "color": "#ff8800", "value": 2.2},
    {"id": "8", "name": "Node 8", "size": 3.0, "color": "#8800ff", "value": 3.0},
    {"id": "9", "name": "Node 9", "size": 1.7, "color": "#008800", "value": 1.7},
    {"id": "10", "name": "Node 10", "size": 2.4, "color": "#000088", "value": 2.4},
    {"id": "11", "name": "Node 11", "size": 1.4, "color": "#888888", "value": 1.4},
    {"id": "12", "name": "Node 12", "size": 2.1, "color": "#ff4488", "value": 2.1},
    {"id": "13", "name": "Node 13", "size": 2.8, "color": "#4488ff", "value": 2.8},
    {"id": "14", "name": "Node 14", "size": 1.9, "color": "#88ff44", "value": 1.9},
    {"id": "15", "name": "Node 15", "size": 2.3, "color": "#4444ff", "value": 2.3},
    {"id": "16", "name": "Node 16", "size": 2.6, "color": "#ff4444", "value": 2.6},
    {"id": "17", "name": "Node 17", "size": 1.3, "color": "#44ff88", "value": 1.3},
    {"id": "18", "name": "Node 18", "size": 1.6, "color": "#8888ff", "value": 1.6},
    {"id": "19", "name": "Node 19", "size": 2.9, "color": "#ff8888", "value": 2.9},
    {"id": "20", "name": "Node 20", "size": 1.1, "color": "#88ff88", "value": 1.1},
]

links = [
    {"source": "1", "target": "2", "width": 1, "color": "#ff0000", "date": datetime(2025, 2, 13, 6, 0, 0)},
    {"source": "2", "target": "3", "width": 2, "color": "#00ff00", "date": datetime(2025, 2, 13, 10, 0, 0)},
    {"source": "3", "target": "4", "width": 3, "color": "#0000ff", "date": datetime(2025, 2, 13, 15, 0, 0)},
    {"source": "4", "target": "5", "width": 4, "color": "#ffff00", "date": datetime(2025, 2, 13, 20, 0, 0)},
    {"source": "5", "target": "6", "width": 2, "color": "#ff00ff", "date": datetime(2025, 2, 14, 2, 0, 0)},
    {"source": "6", "target": "7", "width": 3, "color": "#00ffff", "date": datetime(2025, 2, 14, 6, 0, 0)},
    {"source": "7", "target": "8", "width": 4, "color": "#ff8800", "date": datetime(2025, 2, 14, 10, 0, 0)},
    {"source": "8", "target": "9", "width": 1, "color": "#8800ff", "date": datetime(2025, 2, 14, 14, 0, 0)},
    {"source": "9", "target": "10", "width": 2, "color": "#008800", "date": datetime(2025, 2, 14, 18, 0, 0)},
    {"source": "10", "target": "11", "width": 3, "color": "#000088", "date": datetime(2025, 2, 14, 22, 0, 0)},
    {"source": "11", "target": "12", "width": 4, "color": "#888888", "date": datetime(2025, 2, 15, 2, 0, 0)},
    {"source": "12", "target": "13", "width": 1, "color": "#ff4488", "date": datetime(2025, 2, 15, 6, 0, 0)},
    {"source": "13", "target": "14", "width": 2, "color": "#4488ff", "date": datetime(2025, 2, 15, 10, 0, 0)},
    {"source": "14", "target": "15", "width": 3, "color": "#88ff44", "date": datetime(2025, 2, 15, 14, 0, 0)},
    {"source": "15", "target": "16", "width": 4, "color": "#4444ff", "date": datetime(2025, 2, 15, 18, 0, 0)},
    {"source": "16", "target": "17", "width": 2, "color": "#ff4444", "date": datetime(2025, 2, 15, 22, 0, 0)},
    {"source": "17", "target": "18", "width": 3, "color": "#44ff88", "date": datetime(2025, 2, 16, 2, 0, 0)},
    {"source": "18", "target": "19", "width": 4, "color": "#8888ff", "date": datetime(2025, 2, 16, 6, 0, 0)},
    {"source": "19", "target": "20", "width": 1, "color": "#ff8888", "date": datetime(2025, 2, 16, 10, 0, 0)},
    {"source": "20", "target": "1", "width": 2, "color": "#88ff88", "date": datetime(2025, 2, 16, 14, 0, 0)},
]


def run_query(sql):
    """Helper to send a GET request with a DuckDB query."""
    query = {"sql": sql, "type": "exec"}  # 'exec' means we don't expect row output
    r = requests.get("http://localhost:3000", params={"query": json.dumps(query)})
    if r.status_code != 200:
        print("Error:", r.text)
    return r.text

def upload_data(nodes, links):
    # 1. Create tables if not exist
    run_query("""
        CREATE TABLE IF NOT EXISTS nodes (
            id    VARCHAR,
            name  VARCHAR,
            size  DOUBLE,
            color VARCHAR,
            value DOUBLE
        )
    """)
    run_query("""
        CREATE TABLE IF NOT EXISTS links (
            source VARCHAR,
            target VARCHAR,
            width  DOUBLE,
            color  VARCHAR,
            date   TIMESTAMP
        )
    """)

    # 2. Insert each node into 'nodes'
    for node in nodes:
        sql = f"""
            INSERT INTO nodes (id, name, size, color, value)
            VALUES ('{node["id"]}', '{node["name"]}', {node["size"]},
                    '{node["color"]}', {node["value"]});
        """
        run_query(sql)

    # 3. Insert each link into 'links'
    for link in links:
        # Convert date if needed (string to TIMESTAMP). 
        # If your server can parse ISO strings automatically, just wrap in quotes.
        sql = f"""
            INSERT INTO links (source, target, width, color, date)
            VALUES ('{link["source"]}', '{link["target"]}', {link["width"]},
                    '{link["color"]}', '{link["date"]}');
        """
        run_query(sql)

    print("Upload complete.")

# Finally, call upload_data
upload_data(nodes, links)

def test_show_tables():
    query = {
        "sql": "select name from nodes",
        "type": "json"
    }
    response = requests.get(
        "http://localhost:3000",
        params={"query": json.dumps(query)}
    )
    print("Status:", response.status_code)
    print("Raw response:", response.text)  # Should contain a JSON array of tables
    # print(response.json())

test_show_tables()