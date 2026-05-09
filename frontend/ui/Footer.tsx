"use client";

import Link from "next/link";
import { Heart, Mail, Globe, Coffee, Star } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
function Footer() {
  return (
    <footer className="w-full bg-pink-100 border-t-[2px] border-pink-200 shadow-sm absolute bottom-0 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg flex flex-row font-bold text-pink-800 mb-3">
              {" "}
              <Star className="w-6 h-6 text-yellow-500 rotate-12 mr-[5px]"></Star>
              О проекте
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-pink-700">VibeNote </strong> — все что
              нужно для продуктивности и заботы о себе в одном месте.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-pink-800 mb-3">Разделы</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/personal/diary"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Личный дневник
                </Link>
              </li>
              <li>
                <Link
                  href="/personal/mood-tracker"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Трекер настроения
                </Link>
              </li>
              <li>
                <Link
                  href="/personal/sleep"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Трекер сна
                </Link>
              </li>
              <li>
                <Link
                  href="/business/planner"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Планировщик
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-pink-800 mb-3">Полезное</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/personal/personality"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Тест личности
                </Link>
              </li>
              <li>
                <Link
                  href="/business/study-timer"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  Study timer
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-pink-600 transition"
                >
                  О нас
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-pink-800 mb-3">Контакты</h3>
            <div className="space-y-2">
              <a
                href=""
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition"
              >
                <Mail className="w-4 h-4 text-pink-600" />
                support@vibenote.com
              </a>
              <a
                href="https://github.com/anyamao/diary"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition"
              >
                <SiGithub className="w-4 h-4 text-pink-600" />
                GitHub
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-pink-600" />
                vibenote.ru
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-pink-200 mt-4 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-pink-800">
            © 2026 VibeNote. Все права защищены.
          </p>
          <div className="flex items-center gap-1 text-xs text-pink-800">
            <span>Сделано с</span>
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
            <span>для твоего ментального здоровья</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-pink-600 transition">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-pink-600 transition">
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
