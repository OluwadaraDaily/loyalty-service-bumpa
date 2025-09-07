import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Loyalty Hub - Rewards & Achievements">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <header className="container mx-auto px-6 py-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">Loyalty Hub</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main className="container mx-auto px-6 py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Unlock Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Rewards</span> Journey
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Earn achievements, collect badges, and enjoy cashback rewards with every purchase. Transform your shopping into an engaging loyalty adventure.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            {!auth.user && (
                                <>
                                    <Link
                                        href={register()}
                                        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                                    >
                                        Start Earning Rewards
                                    </Link>
                                    <Link
                                        href={login()}
                                        className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-semibold text-lg dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Earn Achievements</h3>
                            <p className="text-gray-600 dark:text-gray-300">Complete challenges and unlock achievements to show your loyalty progress.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Collect Badges</h3>
                            <p className="text-gray-600 dark:text-gray-300">Earn prestigious badges and show off your accomplishments to other members.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Get Cashback</h3>
                            <p className="text-gray-600 dark:text-gray-300">Enjoy cashback rewards on every purchase and watch your savings grow.</p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Start?</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Join thousands of satisfied customers who are already earning rewards with every purchase.
                            </p>
                            {!auth.user && (
                                <Link
                                    href={register()}
                                    className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                                >
                                    Create Your Account
                                </Link>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
                    <div className="container mx-auto px-6 py-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            © 2025 Loyalty Hub. Transform your purchases into rewards.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}