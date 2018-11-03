
export interface ICommand {
    readonly ID: string;
    run(): void | Promise<void>;
    errorHandler?(e: CommandError): void;
    readonly timeoutDuration?: number;
}

export class CommandError extends Error {
    constructor(message: string, commandId: string) {
        super(message);
        this.name = `Error thrown in ${commandId}`;
    }
}

export class CommandQueue {
    private syncCommandPromise: Promise<void> = Promise.resolve();
    private queue: ICommand[] = [];
    private failFast: boolean;
    private timeoutDuration: number;
    private defaultErrorHandler: (e: CommandError) => void;

    constructor(
        failFast: boolean = false,
        timeoutDuration: number = 5000,
        defaultErrorHandler?: (e: CommandError) => void
    ) {
        this.failFast = failFast;
        this.timeoutDuration = timeoutDuration;
        this.defaultErrorHandler = defaultErrorHandler
            ? defaultErrorHandler
            : (error: CommandError) => {
                if (!error) {
                    return;
                }

                if (typeof error.toString === "function") {
                    console.error(error.toString());
                } else {
                    console.error(error);
                }
            };
    }

    /**
     * Push a command into the command queue, which will be executed
     * after all commands dispatched before are finished.
     */
    public dispatch(command: ICommand) {
        this.queue.push(command);
        this.runNext();
    }

    /**
     * Remove all commands matching the given command ID.
     */
    public remove(commandID: string) {
        this.queue = this.queue.filter(command => command.ID !== commandID);
    }

    /**
     * Return a boolean that tells whether this command queue
     * is initialized with fail fast enabled.
     */
    public failFastEnabled(): boolean {
        return this.failFast;
    }

    /**
     * Remove all commands from the command queue waiting to be executed.
     * This will not stop any commands that have been popped out of the queue
     * from being executed.
     */
    public clear() {
        this.queue = [];
    }

    /**
     * Return a promise which is resolved when all commands
     * dispatched before calling wait() are finished.
     */
    public async finish() {
        await this.syncCommandPromise;
    }

    private runNext() {
        let timer: number;
        let currCommand: ICommand;
        this.syncCommandPromise = this.syncCommandPromise.then(() => {
            if (timer !== undefined) {
                clearTimeout(timer);
            }

            const command: ICommand | void = this.queue.shift();
            if (!command) {
                return;
            }

            const timeoutDuration: number = command.timeoutDuration
                ? command.timeoutDuration
                : this.timeoutDuration;
            timer = setTimeout(() => {
                const timeoutErr: CommandError = new CommandError(
                    `timeout after ${timeoutDuration} milliseconds`,
                    command.ID
                );

                if (currCommand.errorHandler) {
                    currCommand.errorHandler(timeoutErr);
                } else {
                    this.defaultErrorHandler(timeoutErr);
                }
            }, timeoutDuration)

            currCommand = command;

            return command.run();
        }).catch((e: CommandError) => {
            if (timer !== undefined) {
                clearTimeout(timer);
            }

            if (currCommand.errorHandler) {
                currCommand.errorHandler(e);
            } else {
                this.defaultErrorHandler(e);
            }

            if (this.failFast) {
                this.clear();
            }
        });
    }
}
