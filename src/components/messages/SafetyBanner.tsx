import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function SafetyBanner(props: {
  onDismiss: () => void;
  onLearnMore: () => void;
  onReport: () => void;
}) {
  return (
    <Alert className="mb-3">
      <AlertTitle>Stay safe</AlertTitle>
      <AlertDescription className="mt-1 space-y-3">
        <p className="text-sm">
          Never send money or share personal information like your address or financial details. Report suspicious
          behavior.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={props.onLearnMore}>
            Learn more
          </Button>
          <Button size="sm" variant="outline" onClick={props.onReport}>
            Report this user
          </Button>
          <Button size="sm" onClick={props.onDismiss}>
            I understand
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
