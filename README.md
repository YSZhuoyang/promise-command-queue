# CommandQueue

[![Build Status](https://travis-ci.org/YSZhuoyang/CommandQueue.svg?branch=master)](https://travis-ci.org/YSZhuoyang/CommandQueue)

A fairly simple command queue that ensures both commands containing sync code and commands containing async code are executed in sequence, through promises chaining.

## How to use

#### Installation

npm install commandqueue --save
npm install commandqueue@types --save-dev

#### Dispatch tasks

    import { Command, CommandQueue } from "commandqueue";

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
        }),
        // Use a custom error handler
        errorHandler: e => console.error(e)
    };
    const commandQueue = new CommandQueue(true); // Enable fail fast
    commandQueue.dispatch(asyncCommand);
    await commandQueue.finish();
