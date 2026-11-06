import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteLayout } from '@/components/SiteLayout';
import { CategoryPage } from '@/pages/CategoryPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProductPage } from '@/pages/ProductPage';
import { SearchPage } from '@/pages/SearchPage';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
