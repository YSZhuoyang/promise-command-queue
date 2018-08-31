# CommandQueue

[![Build Status](https://travis-ci.org/YSZhuoyang/CommandQueue.svg?branch=master)](https://travis-ci.org/YSZhuoyang/CommandQueue)
[![Coverage Status](https://coveralls.io/repos/github/YSZhuoyang/CommandQueue/badge.svg?branch=master)](https://coveralls.io/github/YSZhuoyang/CommandQueue?branch=master)

A fairly simple command queue that ensures both commands containing sync code and commands containing async code are executed in sequence, through promises chaining.

## How to use

#### Installation

    npm install promisecommandqueue --save

#### Dispatch tasks

    import { Command, CommandQueue } from "promisecommandqueue";

    const commandQueue = new CommandQueue();
    
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
    
    commandQueue.dispatch(asyncCommand);
    commandQueue.dispatch(syncCommand);
    await commandQueue.finish();

#### Custom error handling

    // Enable fail fast, clear the queue whenever an error occurs
    const commandQueue = new CommandQueue(true);
    // ...
    const asyncCommand = {
        ID: "ASYNC_COMMAND",
        run: () => new Promise<void>((resolve, reject) => {
            // Do something ...
        }),
        // Use a custom error handler
        errorHandler: e => {
            console.error(e);
            // Remove commands with the given command ID when an error occurs during the execution of this command
            commandQueue.remove("commandToBeRemoved");
    };
    commandQueue.dispatch(asyncCommand);
    await commandQueue.finish();
