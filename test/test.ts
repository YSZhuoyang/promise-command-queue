
import { Command, CommandQueue } from "../src/commandQueue";

describe("Command Queue test suite", () => {
    test("can dispatch and execute commands in sequence", async () => {
        let commandAFinished: boolean = false;
        let commandBFinished: boolean = false;
        let commandCFinished: boolean = false;
        let commandDFinished: boolean = false;
        const commandA: Command = {
            ID: "COMMAND_A",
            run: () => {
                expect(commandAFinished).toBeFalsy();
                expect(commandBFinished).toBeFalsy();
                expect(commandCFinished).toBeFalsy();
                expect(commandDFinished).toBeFalsy();
                commandAFinished = true;
            }
        };
        const commandB: Command = {
            ID: "COMMAND_B",
            run: () => new Promise<void>((resolve, reject) => {
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
        const commandC: Command = {
            ID: "COMMAND_C",
            run: () => {
                expect(commandAFinished).toBeTruthy();
                expect(commandBFinished).toBeTruthy();
                expect(commandCFinished).toBeFalsy();
                expect(commandDFinished).toBeFalsy();
                commandCFinished = true;
            }
        };
        const commandD: Command = {
            ID: "COMMAND_D",
            run: () => new Promise<void>((resolve, reject) => {
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
        await commandQueue.wait();
        expect(commandDFinished).toBeTruthy();
    });

    test("can handle error thrown by commands and fail fast", async () => {
        let commandBFinished: boolean = false;
        const commandA: Command = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => reject(new Error("Executing " + commandA.ID + " failed")), 10);
                });
            }
        };
        const commandB: Command = {
            ID: "COMMAND_B",
            run: () => {
                commandBFinished = true;
            }
        };
        const commandQueue = new CommandQueue(true);
        expect(commandQueue.failFastEnabled()).toBeTruthy();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        await commandQueue.wait();
        expect(commandBFinished).toBeFalsy();
    });

    test("can handle error thrown by commands and fail safe", async () => {
        let commandBFinished: boolean = false;
        const commandA: Command = {
            ID: "COMMAND_A",
            run: () => {
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => reject(new Error("Executing " + commandA.ID + " failed")), 10);
                });
            }
        };
        const commandB: Command = {
            ID: "COMMAND_B",
            run: () => {
                commandBFinished = true;
            }
        };
        const commandQueue = new CommandQueue(false);
        expect(commandQueue.failFastEnabled()).toBeFalsy();
        commandQueue.dispatch(commandA);
        commandQueue.dispatch(commandB);
        await commandQueue.wait();
        expect(commandBFinished).toBeTruthy();
    });
});
