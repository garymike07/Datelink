import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">Submit a Topic</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Tips, stories, and guidance to help you date safely and confidently.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold">Dating Safety Basics</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Learn practical steps to stay safe before, during, and after a first meet.
            </p>
            <div className="mt-4">
              <Link to="/safety-center"><Button variant="outline">Read Safety Center</Button></Link>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Healthy Communication</h2>
            <p className="text-sm text-muted-foreground mt-2">
              How to set boundaries, communicate intentions, and keep conversations respectful.
            </p>
            <div className="mt-4">
              <Link to="/guidelines"><Button variant="outline">Community Guidelines</Button></Link>
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold">More articles coming soon</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We’re building a library of helpful content. If you’d like a topic covered, send us a message.
          </p>
          <div className="mt-4">
            <Link to="/contact"><Button>Contact Us</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Blog;
