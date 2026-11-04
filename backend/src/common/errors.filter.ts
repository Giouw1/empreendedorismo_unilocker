import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class ErrorsFilter implements ExceptionFilter {
  private readonly logger = new Logger('API');
  catch(error: unknown, host: ArgumentsHost) {
    let statusCode = 500;
    let message: string | string[] = 'Erro interno do servidor.';
    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      const body = error.getResponse();
      message = typeof body === 'string' ? body : (body as { message: string | string[] }).message;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2003', 'P2025', 'P2004'].includes(error.code)) {
      statusCode = error.code === 'P2025' ? 404 : 409;
      message = statusCode === 404 ? 'Recurso não encontrado.' : 'Recurso duplicado, vinculado ou conflitante.';
    } else if (error instanceof Error && 'type' in error && error.type === 'entity.too.large') {
      statusCode = 413; message = 'Corpo da requisição excede o limite permitido.';
    } else {
      this.logger.error(error instanceof Error ? error.stack : String(error));
    }
    host.switchToHttp().getResponse<Response>().status(statusCode).json({ statusCode, message });
  }
}
