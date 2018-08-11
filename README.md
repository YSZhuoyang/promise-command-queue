# CommandQueue

[![Build Status](https://travis-ci.org/YSZhuoyang/CommandQueue.svg?branch=master)](https://travis-ci.org/YSZhuoyang/CommandQueue)

A fairly simple command queue that ensures both commands containing sync code and commands containing async code are executed in sequence, through promises chaining.

## How to use

#### Dispatch tasks
    const syncCommand = {
        ID: "SYNC_COMMAND",
        run: () => {
            // Do something ...
        }
    };
    
    const asyncCommand = {
        ID: "ASYNC_COMMAND",
        run: () => new Promise<void>((resolve, reject) => {
            // Do something ...
            resolve();
        })
    };
    
    const commandQueue = new CommandQueue();
    commandQueue.dispatch(asyncCommand);
    commandQueue.dispatch(syncCommand);
    await commandQueue.finish();
    
#### Custom error handling
    const asyncCommand = {
        ID: "ASYNC_COMMAND",
        run: () => new Promise<void>((resolve, reject) => {
            // Do something ...
            resolve();
        }),
        errorHandler: (e: Error) => console.error(e)
    };
    const commandQueue = new CommandQueue(true); // Enable fail fast
    
