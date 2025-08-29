import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export class NoteController {
  async createNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, content } = req.body;
      const userId = req.user!.id;

      const note = await prisma.note.create({
        data: {
          title,
          content,
          userId,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        note,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.note.count({ where: { userId } }),
      ]);

      res.status(200).json({
        success: true,
        notes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const note = await prisma.note.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found',
        });
      }

      res.status(200).json({
        success: true,
        note,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const userId = req.user!.id;

      const note = await prisma.note.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found',
        });
      }

      const updatedNote = await prisma.note.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(content && { content }),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Note updated successfully',
        note: updatedNote,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const note = await prisma.note.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found',
        });
      }

      await prisma.note.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}