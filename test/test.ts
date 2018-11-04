import { ICommand, CommandError, CommandQueue } from "../src/commandQueue";

describe("ICommand Queue test suite", () => {
    test("can dispatch and execute commands in sequence", async () => {
        let commandAFinished: boolean = false;
        let commandBFinished: boolean = false;
        let commandCFinished: boolean = false;
        let commandDFinished: boolean = false;
        const commandA: ICommand = {
            ID: "COMMAND_A",
            run: () => {
                expect(commandAFinished).toBeFalsy();
                expect(commandBFinished).toBeFalsy();
                expect(commandCFinished).toBeFalsy();
                expect(commandDFinished).toBeFalsy();
                commandAFinished = true;
            }
        };
        const commandB: ICommand = {
            ID: "COMMAND_B",
            run: () =>
                new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandBFinished = true;
                        resolve();
                    }, 10);
                    expect(commandAFinished).toBeTruthy();
                    expect(commandBFinished).toBeFalsy();
                    expect(commandCFinished).toBeFalsy();
                    expect(commandDFinished).toBeFalsy();
                })
        };
        const commandC: ICommand = {
            ID: "COMMAND_C",
            run: () => {
                expect(commandAFinished).toBeTruthy();
                expect(commandBFinished).toBeTruthy();
                expect(commandCFinished).toBeFalsy();
                expect(commandDFinished).toBeFalsy();
                commandCFinished = true;
            }
        };
        const commandD: ICommand = {
            ID: "COMMAND_D",
            run: () =>
                new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandDFinished = true;
                        resolve();
                    }, 10);
                    expect(commandAFinished).toBeTruthy();
                    expect(commandBFinished).toBeTruthy();
                    expect(commandCFinished).toBeTruthy();
                    expect(commandDFinished).toBeFalsy();
                })
        };
        const commandQueue = new CommandQueue();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        commandQueue.dispatch(commandC);
        commandQueue.dispatch(commandD);
        await commandQueue.finish();

        expect(commandDFinished).toBeTruthy();
    });

    test("can handle error thrown by commands and fail fast", async () => {
        const errorLoggerSpy: jasmine.Spy = spyOn(console, "error");
        let commandBFinished: boolean = false;
        const commandA: ICommand = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(
                        () =>
                            reject(
                                new CommandError(
                                    "Executing " + commandA.ID + " failed",
                                    commandA.ID
                                )
                            ),
                        10
                    );
                });
            }
        };
        const commandB: ICommand = {
            ID: "COMMAND_B",
            run: () => {
                commandBFinished = true;
            }
        };
        const commandQueue = new CommandQueue(true);
        expect(commandQueue.failFastEnabled()).toBeTruthy();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        await commandQueue.finish();

        expect(commandBFinished).toBeFalsy();
        expect(errorLoggerSpy).toHaveBeenCalled();
    });

    test("can handle error thrown by commands and fail safe", async () => {
        const errorLoggerSpy: jasmine.Spy = spyOn(console, "error");
        const commandAId: string = "COMMAND_A";
        const commandAError: CommandError = new CommandError(
            `Executing ${commandAId} failed`,
            commandAId
        );
        let commandBFinished: boolean = false;
        const commandA: ICommand = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => reject(commandAError), 10);
                });
            }
        };
        const commandB: ICommand = {
            ID: "COMMAND_B",
            run: () => {
                commandBFinished = true;
            }
        };
        const commandQueue: CommandQueue = new CommandQueue(false);
        expect(commandQueue.failFastEnabled()).toBeFalsy();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        await commandQueue.finish();

        // Verify that previous commands fail does not prevent
        // the rest commands to be executed.
        expect(commandBFinished).toBeTruthy();
        // Verify that error can be handled by the default handler
        expect(errorLoggerSpy).toHaveBeenCalledWith(commandAError.toString());
    });

    test("waits for commands to finish", async () => {
        let commandAFinished = false;
        let commandBFinished = false;
        const commandA: ICommand = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandAFinished = true;
                        resolve();
                    }, 10);
                });
            }
        };
        const commandB: ICommand = {
            ID: "COMMAND_B",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandBFinished = true;
                        resolve();
                    }, 10);
                });
            }
        };
        const commandQueue = new CommandQueue();
        commandQueue.dispatch(commandA);
        await commandQueue.finish();

        expect(commandAFinished).toBeTruthy();
        expect(commandBFinished).toBeFalsy();

        commandQueue.dispatch(commandB);
        await commandQueue.finish();

        expect(commandAFinished).toBeTruthy();
        expect(commandBFinished).toBeTruthy();
    });

    test("removes commands matching any given command ID", async () => {
        let commandAFinished = false;
        let commandBFinished = false;
        const commandA: ICommand = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandAFinished = true;
                        resolve();
                    }, 10);
                });
            }
        };
        const commandB: ICommand = {
            ID: "COMMAND_B",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        commandBFinished = true;
                        resolve();
                    }, 10);
                });
            }
        };
        const commandQueue = new CommandQueue();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        commandQueue.remove(commandB.ID);
        await commandQueue.finish();

        expect(commandAFinished).toBeTruthy();
        expect(commandBFinished).toBeFalsy();
    });

    test("handles null argument passed as errors with default error handler", async () => {
        const errorGenerator: ICommand = {
            ID: "ERROR_GEN",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    reject(null);
                });
            }
        };
        const commandQueue: CommandQueue = new CommandQueue();
        commandQueue.dispatch(errorGenerator);
        // No uncaught error should be throw.
        await commandQueue.finish();
    });

    test("handles custom argument passed as errors with default error handler", async () => {
        const customErr: string = "Custom error";
        const errorGenerator: ICommand = {
            ID: "ERROR_GEN",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    reject(customErr);
                });
            }
        };
        const errorLoggerSpy: jasmine.Spy = spyOn(console, "error");
        const commandQueue: CommandQueue = new CommandQueue();
        commandQueue.dispatch(errorGenerator);
        await commandQueue.finish();

        const expectedErrorHandled: CommandError = errorLoggerSpy.calls.mostRecent()
            .args[0];
        expect(expectedErrorHandled).toEqual(customErr);
    });

    test("handles error with custom error handler", async () => {
        const errorGenerator: ICommand = {
            ID: "ERROR_GEN",
            run: () => {
                throw new CommandError("An error", errorGenerator.ID);
            },
            errorHandler: (e: CommandError) => undefined
        };
        const handleErrorSpy: jasmine.Spy = spyOn(
            errorGenerator,
            "errorHandler"
        );
        const commandQueue: CommandQueue = new CommandQueue();
        commandQueue.dispatch(errorGenerator);
        await commandQueue.finish();

        const expectedErrorHandled: CommandError = handleErrorSpy.calls.mostRecent()
            .args[0];
        expect(expectedErrorHandled).toEqual(
            new CommandError("An error", errorGenerator.ID)
        );
    });

    test("handles timeout error with default error handler", async () => {
        const timeoutGenerator: ICommand = {
            ID: "TIMEOUT_ERROR_GEN",
            // Change deadline to 10
            timeoutDuration: 10,
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    // Resolved after the deadline
                    setTimeout(() => {
                        resolve();
                    }, 30);
                });
            }
        };
        const defaultErrorHandler = (e: CommandError) =>
            console.error(e.toString());
        const commandQueue: CommandQueue = new CommandQueue(
            false,
            5000,
            defaultErrorHandler
        );
        const errorLoggerSpy: jasmine.Spy = spyOn(console, "error");
        commandQueue.dispatch(timeoutGenerator);
        await commandQueue.finish();

        const expectedErrorHandled: CommandError = errorLoggerSpy.calls.mostRecent()
            .args[0];
        expect(expectedErrorHandled).toEqual(
            new CommandError(
                `timeout after ${
                    timeoutGenerator.timeoutDuration
                } milliseconds`,
                timeoutGenerator.ID
            ).toString()
        );
    });

    test("handles timeout error with custom error handler", async () => {
        const timeoutGenerator: ICommand = {
            ID: "TIMEOUT_ERROR_GEN",
            // Change deadline to 10
            timeoutDuration: 10,
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    // Resolved after the deadline
                    setTimeout(() => {
                        resolve();
                    }, 30);
                });
            },
            errorHandler: (e: CommandError) => undefined
        };
        const handleErrorSpy: jasmine.Spy = spyOn(
            timeoutGenerator,
            "errorHandler"
        );
        const commandQueue: CommandQueue = new CommandQueue();
        commandQueue.dispatch(timeoutGenerator);
        await commandQueue.finish();

        const expectedErrorHandled: CommandError = handleErrorSpy.calls.mostRecent()
            .args[0];
        expect(expectedErrorHandled).toEqual(
            new CommandError(
                `timeout after ${
                    timeoutGenerator.timeoutDuration
                } milliseconds`,
                timeoutGenerator.ID
            )
        );
    });
});
