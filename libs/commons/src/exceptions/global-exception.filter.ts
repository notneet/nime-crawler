import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();
    const status =
      exception?.response?.statusCode ||
      exception?.response?.response?.statusCode ||
      HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the exception (you can use your preferred logging library here)
    // console.error(exception);
    // console.log(exception instanceof TypeError);
    // console.log(exception instanceof HttpException);

    switch (true) {
      case exception instanceof AxiosError:
        response.status(status).json({
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: `Error while hit [${exception?.config?.method}]: ${exception?.config?.url} (${exception?.message})`,
          payload: exception?.config?.data || null,
        });
        return;
      case exception instanceof TypeError:
        let errorMessage = exception?.message;
        const [fileName, lineCode] =
          this.extractFilenameAndLineNumber(exception);

        response.status(status).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error in ${fileName} at line ${lineCode}: ${errorMessage}`,
        });
        return;
      default:
        response.status(status).json({
          statusCode: status,
          message:
            exception.response.message ||
            exception.message ||
            'Internal server error',
        });
        return;
    }
  }

  private extractFilenameAndLineNumber(
    error: any,
  ): [string | string[], string] {
    let fileName: string | string[] = 'unknown';
    let lineNumber: string = '';
    const match: string[] = error.stack.match(/at .* \((.*:\d+:\d+)\)/g);

    if (match && match[1]) {
      const parts = match[match?.length - 2].split(':');
      fileName = String(parts[0])?.split('/');
      fileName = fileName[fileName?.length - 1];
      lineNumber = parts[1];
    }
    return [fileName, lineNumber];
  }
}
