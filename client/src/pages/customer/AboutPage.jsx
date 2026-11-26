import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CoffeeImage from '../../components/CoffeeImage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function AboutPage() {
  const { settings } = useSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="text-xs font-medium tracking-wider text-[#9A551E]">
            {settings?.established_year || 'Est. 2019'} · {settings?.shop_name || 'Roast & Reverie'}
          </p>
          <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight text-[#2A1B12] sm:text-5xl">
            {settings?.about_title || 'Slow Roasting. Honest Sourcing. Quiet Craft.'}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[#6E5A4F]">
            {settings?.about_story ||
              'Founded in Lahore in 2019, Roast & Reverie began around a single drum roaster with a quiet conviction: daily coffee deserves unhurried care.'}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#6E5A4F]">
            Every week, we cup and roast traceable Arabica micro-lots from Ethiopia, Colombia, Guatemala, and Brazil, dialing each espresso recipe by weight, water chemistry, and roast resting window.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-md bg-[#2A1B12] px-5 py-3 text-sm font-medium text-[#FAF6F0] hover:bg-[#B86B2B]"
            >
              Explore Our Menu
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-md border border-[#E5D9C8] px-5 py-3 text-sm font-medium text-[#2A1B12] hover:border-[#2A1B12]"
            >
              Visit the Café
            </Link>
          </div>
        </div>

        <div className="overflow-hidden border border-[#E5D9C8] bg-[#F3ECE1] lg:col-span-6">
          <CoffeeImage
            src={settings?.hero_image_url || '/src/assets/images/hero_coffee_roastery_1795667817953.jpg'}
            alt="Roast & Reverie Espresso Bar"
            className="h-full min-h-[340px] w-full object-cover"
          />
        </div>
      </div>

      <div className="mt-16 grid gap-8 border-t border-[#E5D9C8] pt-12 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs font-semibold text-[#9A551E]">01</p>
          <h2 className="mt-2 font-editorial text-xl font-semibold text-[#2A1B12]">Weekly Small-Batch Roasting</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E5A4F]">
            Beans are roasted in 12 kg batches every Tuesday and rested 5 days before hitting our espresso hoppers or retail shelves.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs font-semibold text-[#9A551E]">02</p>
          <h2 className="mt-2 font-editorial text-xl font-semibold text-[#2A1B12]">Live Kitchen &amp; Bar Inventory</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E5A4F]">
            Every baked pastry, cold brew bottle, and whole-bean roast is tracked live so what you order is freshly available.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs font-semibold text-[#9A551E]">03</p>
          <h2 className="mt-2 font-editorial text-xl font-semibold text-[#2A1B12]">In-House Viennoiserie</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E5A4F]">
            72-hour fermented croissants and dark espresso ganache tarts leave our deck oven each morning at 7:00 AM.
          </p>
        </div>
      </div>
    </div>
  );
}
