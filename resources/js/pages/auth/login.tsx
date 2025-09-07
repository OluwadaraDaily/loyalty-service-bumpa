import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Shield, Star, Trophy } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="Welcome to Loyalty Hub" description="Sign in to access your rewards, achievements, and exclusive benefits">
            <Head title="Log in" />

            {/* Loyalty Program Benefits */}
            <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                    <Trophy className="mb-1 h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Achievements</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-green-50 p-3 dark:bg-green-950">
                    <Star className="mb-1 h-6 w-6 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Rewards</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-purple-50 p-3 dark:bg-purple-950">
                    <Shield className="mb-1 h-6 w-6 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Badges</span>
                </div>
            </div>

            <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Log in
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
