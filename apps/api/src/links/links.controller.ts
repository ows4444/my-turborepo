import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';

import {
  CreateLinkSchema,
  UpdateLinkSchema,
  type CreateLink,
  type UpdateLink,
} from '@repo/schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateLinkSchema))
    body: CreateLink,
  ) {
    return this.linksService.create(body);
  }

  @Get()
  findAll() {
    return this.linksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.linksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateLinkSchema))
    body: UpdateLink,
  ) {
    return this.linksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.linksService.remove(id);
  }
}
