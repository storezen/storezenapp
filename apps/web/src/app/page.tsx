import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-emerald-600">Storezen</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your all-in-one e-commerce platform. Create your store, manage products, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Products
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Store Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Storezen?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Store Setup</h3>
              <p className="text-gray-600">Create your online store in minutes with our intuitive dashboard.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Product Management</h3>
              <p className="text-gray-600">Manage inventory, pricing, and orders from a single dashboard.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Grow Your Business</h3>
              <p className="text-gray-600">Built-in analytics and marketing tools to help you scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Join thousands of sellers on Storezen today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                Create Your Store
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-emerald-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2026 Storezen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}