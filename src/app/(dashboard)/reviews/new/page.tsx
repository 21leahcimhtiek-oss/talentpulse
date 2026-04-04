import ReviewForm from '@/components/ReviewForm';

export const metadata = { title: 'New Review' };

export default function NewReviewPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Performance Review</h1>
        <p className="text-gray-500 mt-1">
          Complete a structured performance review for a team member.
        </p>
      </div>
      <ReviewForm />
    </div>
  );
}