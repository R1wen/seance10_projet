import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { Prisma } from '../../prisma/generated';

// GET /api/products — code du TP adapté
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category as string;
    }

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take: Number(limit),
        skip,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/products/:id
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, imageUrl, stock, category } = req.body;

    if (!name || !price || !category) {
      res.status(400).json({ error: 'Name, price, and category are required' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        stock: stock || 0,
        category,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const { name, description, price, imageUrl, stock, category } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, imageUrl, stock, category },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};