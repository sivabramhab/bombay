import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">ABOUT</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-lg font-semibold mb-4">HELP</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-white">Shipping</Link></li>
              <li><Link href="/returns" className="hover:text-white">Returns</Link></li>
              <li><Link href="/support" className="hover:text-white">Support</Link></li>
            </ul>
          </div>

          {/* Seller */}
          <div>
            <h3 className="text-lg font-semibold mb-4">SELLER</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/seller/register" className="hover:text-white">Sell on MarketPlace</Link></li>
              <li><Link href="/seller/guide" className="hover:text-white">Seller Guide</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-white">Seller Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">LEGAL</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">CUSTOMER SERVICE</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/track-order" className="hover:text-white transition">Track Your Order</Link></li>
              <li><Link href="/delivery" className="hover:text-white transition">Delivery Options</Link></li>
              <li><Link href="/returns" className="hover:text-white transition">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">24/7 Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Delivery Options Banner */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚚</div>
              <div>
                <div className="font-semibold text-sm">Free Delivery</div>
                <div className="text-xs text-gray-400">On orders above ₹500</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏪</div>
              <div>
                <div className="font-semibold text-sm">Pickup Available</div>
                <div className="text-xs text-gray-400">From seller locations</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚇</div>
              <div>
                <div className="font-semibold text-sm">Metro Pickup</div>
                <div className="text-xs text-gray-400">Near metro stations</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">💰</div>
              <div>
                <div className="font-semibold text-sm">10% Cheaper</div>
                <div className="text-xs text-gray-400">Guaranteed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2024 MarketPlace. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/facebook" className="text-gray-400 hover:text-white">Facebook</Link>
              <Link href="/twitter" className="text-gray-400 hover:text-white">Twitter</Link>
              <Link href="/instagram" className="text-gray-400 hover:text-white">Instagram</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

