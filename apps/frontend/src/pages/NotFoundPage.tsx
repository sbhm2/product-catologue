import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/Feedback';
import { buttonStyles } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <EmptyState
        title="Page not found"
        message="The page you were looking for does not exist. The catalogue is still open, though."
        action={
          <Link to="/" className={buttonStyles({ className: 'mt-2' })}>
            Back to the catalogue
          </Link>
        }
      />
    </div>
  );
}
