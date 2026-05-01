import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateLink, UpdateLink } from '@repo/schemas';
import * as escapeHtml from 'escape-html';

@Injectable()
export class LinksService {
  private readonly links: (CreateLink & { id: number })[] = [];
  private idSeq = 1;

  create(input: CreateLink) {
    const safeTitle = escapeHtml(input.title ?? '');
    const link = {
      id: this.idSeq++,
      ...input,
      title: safeTitle,
    };
    this.links.push(link);
    return link;
  }

  findAll() {
    return this.links;
  }

  findOne(id: number) {
    const link = this.links.find((l) => l.id === id);
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }

  update(id: number, input: UpdateLink) {
   
    const index = this.links.findIndex((l) => l.id === id);
    return index
  }

  remove(id: number) {
    const index = this.links.findIndex((l) => l.id === id);
    if (index === -1) throw new NotFoundException('Link not found');
    this.links.splice(index, 1);
    return true;
  }
}
