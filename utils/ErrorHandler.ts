class ErrorHandler extends Error {
    message: any;
    statusCode: number;
    constructor(message: any, statusCode: number){
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ErrorHandler;