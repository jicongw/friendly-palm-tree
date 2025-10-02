import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { MapIcon } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <MapIcon className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Trip Planner</h1>
          </div>
          <p className="text-gray-600">
            Plan your perfect trip with our comprehensive travel planning application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue planning your trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server"
                await signIn("google", { redirectTo: "/" })
              }}
            >
              <Button type="submit" className="w-full">
                Sign in with Google
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}