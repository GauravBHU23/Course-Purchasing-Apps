import { Loader } from "@/components/Loader";

export default function Loading() {
  return (
    <main className="shell">
      <div className="page-loader">
        <Loader label="Loading CourseStack..." />
      </div>
    </main>
  );
}
