import { Router } from 'express';
import type { CatalogService } from '../../business/services/CatalogService';
import { createCatalogController } from '../controllers/catalogController';

export function createCatalogRouter(catalogService: CatalogService): Router {
  const router = Router();
  const controller = createCatalogController(catalogService);

  router.get('/', controller.list);
  router.get('/:id', controller.detail);

  return router;
}

export function createCategoriesRouter(catalogService: CatalogService): Router {
  const router = Router();
  const controller = createCatalogController(catalogService);

  router.get('/', controller.categories);

  return router;
}

export function createSearchRouter(catalogService: CatalogService): Router {
  const router = Router();
  const controller = createCatalogController(catalogService);

  router.get('/', controller.searchByTitle);

  return router;
}
