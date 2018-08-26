# CommandQueue

[![Build Status](https://travis-ci.org/YSZhuoyang/CommandQueue.svg?branch=master)](https://travis-ci.org/YSZhuoyang/CommandQueue)
[![Coverage Status](https://coveralls.io/repos/github/YSZhuoyang/CommandQueue/badge.svg?branch=master)](https://coveralls.io/github/YSZhuoyang/CommandQueue?branch=master)

A fairly simple command queue that ensures both commands containing sync code and commands containing async code are executed in sequence, through promises chaining.

## How to use

#### Installation

    npm install promisecommandqueue --save

#### Dispatch tasks

    import { Command, CommandQueue } from "promisecommandqueue";

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
