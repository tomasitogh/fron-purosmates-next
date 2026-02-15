import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-[#E8DCC4] text-[#3D5F54]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Desktop Layout - 3 columns */}
                <div className="hidden md:grid md:grid-cols-3 gap-12 items-start">
                    {/* Logo Column */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center space-x-3 mb-4">
                            <Link href="/">
                                <Image
                                    src="/logo-purosmates.png"
                                    alt="Puros Mates Logo"
                                    width={80}
                                    height={80}
                                    className="object-contain p-1"
                                />
                            </Link>
                        </div>
                        <Link
                            href="/"
                            className="text-2xl font-bold text-[#3D5F54] hover:opacity-80 transition"
                        >
                            PUROS MATES
                        </Link>
                    </div>

                    {/* Products Column */}
                    <div>
                        <Link href="/">
                            <h3 className="text-[#3D5F54] text-2xl font-bold mb-6 hover:opacity-80 transition">
                                Productos
                            </h3>
                        </Link>
                        <ul className="space-y-3 text-lg">
                            <li>
                                <Link
                                    href="/?category=mate"
                                    className="hover:opacity-70 transition"
                                >
                                    Mates
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?category=bombilla"
                                    className="hover:opacity-70 transition"
                                >
                                    Bombillas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?category=accesorio"
                                    className="hover:opacity-70 transition"
                                >
                                    Accesorios
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* About Column */}
                    <div>
                        <Link href="/">
                            <h3 className="text-[#3D5F54] text-2xl font-bold mb-6 hover:opacity-80 transition">
                                Puros Mates
                            </h3>
                        </Link>
                        <div className="flex space-x-4 mt-6">
                            <a
                                href="https://www.instagram.com/puros.mates/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Síguenos en Instagram"
                                className="hover:opacity-80 transition"
                            >
                                <Image
                                    src="/instagram.png"
                                    alt="Instagram"
                                    width={48}
                                    height={32}
                                    className="object-contain"
                                    style={{ width: '48px', height: 'auto', aspectRatio: '48/32' }}
                                />
                            </a>
                            <a
                                href="https://wa.me/5491130548207"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contáctanos por WhatsApp"
                                className="hover:opacity-80 transition"
                            >
                                <Image
                                    src="/wpp.png"
                                    alt="WhatsApp"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                    style={{ width: '32px', height: 'auto', aspectRatio: '1/1' }}
                                />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout - Centered */}
                <div className="md:hidden flex flex-col items-center text-center space-y-10">
                    {/* Logo */}
                    <div className="flex flex-col items-center">
                        <Link href="/" className="mb-4">
                            <Image
                                src="/logo-purosmates.png"
                                alt="Puros Mates Logo"
                                width={128}
                                height={128}
                                className="object-contain p-1"
                            />
                        </Link>
                        <Link
                            href="/"
                            className="text-3xl font-bold text-[#3D5F54] hover:opacity-80 transition"
                        >
                            PUROS MATES
                        </Link>
                    </div>

                    {/* Products */}
                    <div>
                        <Link href="/">
                            <h3 className="text-[#3D5F54] text-2xl font-bold mb-4 hover:opacity-80 transition">
                                Productos
                            </h3>
                        </Link>
                        <ul className="space-y-2 text-lg">
                            <li>
                                <Link
                                    href="/?category=mate"
                                    className="hover:opacity-70 transition"
                                >
                                    Mates
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?category=bombilla"
                                    className="hover:opacity-70 transition"
                                >
                                    Bombillas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/?category=accesorio"
                                    className="hover:opacity-70 transition"
                                >
                                    Accesorios
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* About */}
                    <div>
                        <Link href="/">
                            <h3 className="text-[#3D5F54] text-2xl font-bold mb-4 hover:opacity-80 transition">
                                Puros Mates
                            </h3>
                        </Link>
                        <div className="flex justify-center space-x-4 mt-6">
                            <a
                                href="https://www.instagram.com/puros.mates/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Síguenos en Instagram"
                                className="hover:opacity-80 transition"
                            >
                                <Image
                                    src="/instagram.png"
                                    alt="Instagram"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                    style={{ width: '40px', height: 'auto', aspectRatio: '1/1' }}
                                />
                            </a>
                            <a
                                href="https://wa.me/5491130548207"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contáctanos por WhatsApp"
                                className="hover:opacity-80 transition"
                            >
                                <Image
                                    src="/wpp.png"
                                    alt="WhatsApp"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                    style={{ width: '40px', height: 'auto', aspectRatio: '1/1' }}
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-[#3D5F54]/20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <p className="text-center text-[#3D5F54]">
                        Copyright © Puros Mates {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </footer>
    );
}
