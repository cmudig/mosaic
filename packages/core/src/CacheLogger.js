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

    clear() {
        localStorage.removeItem(this.storageKey);
    }

}