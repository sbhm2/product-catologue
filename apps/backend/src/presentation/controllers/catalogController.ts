import { productQuerySchema } from '@catalogue/contracts';
import type { RequestHandler } from 'express';
import { ValidationError } from '../../business/errors';
import type { CatalogService } from '../../business/services/CatalogService';
import { toFieldErrors } from '../../business/validation';

export interface CatalogController {
  list: RequestHandler;
  detail: RequestHandler;
  categories: RequestHandler;
  searchByTitle: RequestHandler;
}

export function createCatalogController(catalogService: CatalogService): CatalogController {
  const list: RequestHandler = async (req, res) => {
    const parsed = productQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('The product query is invalid.', toFieldErrors(parsed.error));
    }

    const result = await catalogService.listProducts(parsed.data);
    res.status(200).json({ data: result.products, meta: result.meta });
  };

  const detail: RequestHandler = async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
    const product = await catalogService.getProductById(id);
    res.status(200).json({ data: product });
  };

  const categories: RequestHandler = async (_req, res) => {
    const categories = await catalogService.getCategories();
    res.status(200).json({ data: categories });
  };

  const searchByTitle: RequestHandler = async (req, res) => {
    const rawQuery = Array.isArray(req.query.search)
      ? (req.query.search[0] ?? '').toString()
      : (req.query.search ?? '').toString();

    const result = await catalogService.searchProductsByTitle(rawQuery);
    res.status(200).json({ data: result, meta: { total: result.length, category: null, search: rawQuery } });
  };

  return { list, detail, categories, searchByTitle };
}
