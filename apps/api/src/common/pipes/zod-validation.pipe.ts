import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodType, infer as Infer } from 'zod';

@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private schema: T) {}

  transform(value: unknown): Infer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.flatten();

      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }
}
