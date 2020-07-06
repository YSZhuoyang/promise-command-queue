# promise-command-queue

[![Build Status](https://travis-ci.org/YSZhuoyang/promise-command-queue.svg?branch=master)](https://travis-ci.org/YSZhuoyang/promise-command-queue)
[![Coverage Status](https://coveralls.io/repos/github/YSZhuoyang/promise-command-queue/badge.svg?branch=master)](https://coveralls.io/github/YSZhuoyang/promise-command-queue?branch=master)

A fairly simple command queue that ensures both commands with sync code and commands with async code are executed one by one in sequence, through promises chaining. The idea is to:

- Ensure errors can always be captured and handled properly whenever they occur.
- Encapsulate business logic associated in commands which can be easily changed and tested.

## How to use

#### Installation

    npm install promisecommandqueue --save

#### Dispatch tasks

    import { ICommand, CommandQueue } from "promisecommandqueue";

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
        }
    };
    commandQueue.dispatch(asyncCommand);
    await commandQueue.finish();
