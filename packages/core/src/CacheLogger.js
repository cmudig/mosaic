export class CacheLogger {
    constructor() {
        this.storageKey = 'queryLogs';
        this.clear();
    }

    record(query, latency) {
        let logs = JSON.parse(localStorage.getItem(this.storageKey)) || [];

        const logEntry = {
            query: query,
            timestamp: new Date().toISOString(),
            latency: latency,
            size: new Blob([query]).size,
        };

        logs.push(logEntry);
        localStorage.setItem('queryLogs', JSON.stringify(logs));
    }

    retrieve() {
        const savedLogs = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        return savedLogs;
    }

    displayLogsAsTable() {
        const logs = JSON.parse(localStorage.getItem(this.storageKey)) || [];

        const formattedLogs = logs.map((log) => ({
            Query: log.query,
            Timestamp: log.timestamp,
            Latency: log.latency,
            Size: `${log.size} bytes`,
        }));

        console.table(formattedLogs);
    }


    downloadLogs() { // will allow user to download cache.json
        // same formattedLogs as displayLogsAsTable
        const logs = JSON.parse(localStorage.getItem(this.storageKey)) || [];

        const formattedLogs = logs.map((log) => ({
            Query: log.query,
            Timestamp: log.timestamp,
            Latency: log.latency,
            Size: `${log.size} bytes`,
        }));

        const blob = new Blob([JSON.stringify(formattedLogs, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cache.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }

}