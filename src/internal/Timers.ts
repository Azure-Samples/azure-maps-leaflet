type WorkerHandler = {callback: () => void, worker: Worker};

const SetTimeoutWorkerCode = `onmessage = function (event) {
    var delay = event.data.time; // milliseconds
    var before = Date.now();
    while (Date.now() < before + delay) { };
    postMessage({id: event.data.id});
};`;

/** A class that provides a setTimeout function that will work in inactive browser tabs, or during mobile lock screens. */
export class Timers {

    private static _workerTable: { [key: number]: WorkerHandler } = {};

    public static clearTimeout(id: number): void {
        const w = Timers._workerTable[id];
        if(w) {
            w.worker.terminate();
            delete Timers._workerTable[id];
        }
    }

    public static setTimeout(callback: () => void, timeout: number): number {
        const id = Math.round(Math.random() * 1000000000);

        const blob = new Blob([SetTimeoutWorkerCode]);
        const blobURL = window.URL.createObjectURL(blob);
  
        const worker = new Worker(blobURL);
        
        worker.addEventListener("message", Timers._receivedSetTimeoutMessage);

        Timers._workerTable[id] = {
            callback: callback,
            worker: worker
        };
  
        //Start the worker.
        worker.postMessage({id: id, time: timeout});

        return id;
    }

    private static _receivedSetTimeoutMessage(e: any): void {        
        const w = Timers._workerTable[e.data.id];
        if(w) {
            w.callback();
            w.worker.terminate();
            delete Timers._workerTable[e.data.id];
        }
    }
}