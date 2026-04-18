import re
import os

filepath = '/Users/tomasgonzalezh/Projects/fron-purosmates-next/app/carrito/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add axios import
if 'import axios from "axios";' not in content and "import axios from 'axios';" not in content:
    content = content.replace('import toast from \'react-hot-toast\';', "import toast from 'react-hot-toast';\nimport axios from 'axios';")

# 2. Update guestData state
old_state = """    const [guestData, setGuestData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: ''
    });"""
new_state = """    const [guestData, setGuestData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        shippingPreference: 'vendedor',
        locality: '',
        address: '',
        floorApartment: '',
        extraIndications: '',
    });"""
content = content.replace(old_state, new_state)

# 3. Add useEffect for fetching user data
old_effect = """    useEffect(() => {
        setMounted(true);
    }, []);"""
new_effect = """    useEffect(() => {
        setMounted(true);
        if (isAuthenticated && token) {
            axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(response => {
                const data = response.data;
                if (data) {
                    setGuestData(prev => ({
                        ...prev,
                        phone: data.phoneNumber || prev.phone,
                        shippingPreference: data.shippingPreference || 'vendedor',
                        locality: data.locality || '',
                        address: data.address || '',
                        floorApartment: data.floorApartment || '',
                        extraIndications: data.extraIndications || '',
                        // Extract firstname/lastname from name
                        firstname: prev.firstname || (data.name ? data.name.split(' ')[0] : ''),
                        lastname: prev.lastname || (data.name ? data.name.split(' ').slice(1).join(' ') : ''),
                    }));
                }
            }).catch(e => console.error("Error fetching user data", e));
        }
    }, [isAuthenticated, token]);"""
content = content.replace(old_effect, new_effect)

# 4. Validation in handleFinalizePurchase
old_val = """        if (!isAuthenticated && (!guestData.phone || !guestData.email)) {
            toast.error('El número de teléfono y el email son obligatorios para coordinar el envío y enviar el comprobante.');
            return;
        }"""
new_val = """        if (!guestData.firstname || !guestData.lastname || !guestData.phone) {
            toast.error('Nombre, apellido y teléfono son obligatorios.');
            return;
        }
        if (!isAuthenticated && !guestData.email) {
            toast.error('El email es obligatorio para continuar.');
            return;
        }
        if (guestData.shippingPreference === 'correo') {
            if (!guestData.locality || !guestData.address || !guestData.floorApartment) {
                toast.error('Para envío por Correo Argentino, la localidad, dirección exacta y piso/departamento son obligatorios.');
                return;
            }
        }"""
content = content.replace(old_val, new_val)

# 5. guestData payload
old_payload = """                guestData: {
                    guestPhone: guestData.phone,
                    ...(!isAuthenticated ? {
                        guestFirstname: guestData.firstname,
                        guestLastname: guestData.lastname,
                        guestEmail: guestData.email,
                    } : {})
                },"""
new_payload = """                guestData: {
                    guestPhone: guestData.phone,
                    guestFirstname: guestData.firstname,
                    guestLastname: guestData.lastname,
                    shippingPreference: guestData.shippingPreference,
                    locality: guestData.locality,
                    address: guestData.address,
                    floorApartment: guestData.floorApartment,
                    extraIndications: guestData.extraIndications,
                    ...(!isAuthenticated ? {
                        guestEmail: guestData.email,
                    } : {})
                },"""
content = content.replace(old_payload, new_payload)

# 6. UI insertions
shipping_section = """
                    {/* Preferencia de envío */}
                    <div className="mb-8 border-b pb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Preferencia de envío</h3>
                        <div className="space-y-4">
                            <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="shippingPreference"
                                    value="correo"
                                    checked={guestData.shippingPreference === 'correo'}
                                    onChange={() => setGuestData({ ...guestData, shippingPreference: 'correo' })}
                                    className="mt-1 w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Correo Argentino</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Envíos a todo el país.
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="shippingPreference"
                                    value="vendedor"
                                    checked={guestData.shippingPreference === 'vendedor'}
                                    onChange={() => setGuestData({ ...guestData, shippingPreference: 'vendedor' })}
                                    className="mt-1 w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Me comunico con el vendedor</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Coordinar un punto de retiro con el vendedor.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
"""

old_datos = """                    {/* Subtítulo 2: Datos personales */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 margin">Datos personales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {!isAuthenticated && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo (Opcional)</label>
                                        <input
                                            type="text"
                                            value={guestData.firstname}
                                            onChange={(e) => setGuestData({ ...guestData, firstname: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Tu nombre"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Obligatorio)</label>
                                        <input
                                            type="email"
                                            value={guestData.email}
                                            onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono (Obligatorio)</label>
                                <input
                                    type="tel"
                                    value={guestData.phone}
                                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                    placeholder="Ej: 11 1234 5678"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Para coordinar el envío y pago.</p>
                            </div>
                        </div>
                    </div>"""

new_datos = shipping_section + """
                    {/* Subtítulo 2: Datos personales */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 margin">Datos personales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (Obligatorio)</label>
                                <input
                                    type="text"
                                    value={guestData.firstname}
                                    onChange={(e) => setGuestData({ ...guestData, firstname: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                    placeholder="Tu nombre"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido (Obligatorio)</label>
                                <input
                                    type="text"
                                    value={guestData.lastname}
                                    onChange={(e) => setGuestData({ ...guestData, lastname: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                    placeholder="Tu apellido"
                                    required
                                />
                            </div>

                            {!isAuthenticated && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Obligatorio)</label>
                                    <input
                                        type="email"
                                        value={guestData.email}
                                        onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono (Obligatorio)</label>
                                <input
                                    type="tel"
                                    value={guestData.phone}
                                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                    placeholder="Ej: 11 1234 5678"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Para coordinar el envío y pago.</p>
                            </div>

                            {guestData.shippingPreference === 'correo' && (
                                <>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Localidad (Obligatorio)</label>
                                        <input
                                            type="text"
                                            value={guestData.locality}
                                            onChange={(e) => setGuestData({ ...guestData, locality: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Ej: Córdoba Capital"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección exacta (Obligatorio)</label>
                                        <input
                                            type="text"
                                            value={guestData.address}
                                            onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Ej: San Martín 123"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Piso y departamento (Obligatorio)</label>
                                        <input
                                            type="text"
                                            value={guestData.floorApartment}
                                            onChange={(e) => setGuestData({ ...guestData, floorApartment: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Ej: PB A"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones extras</label>
                                        <input
                                            type="text"
                                            value={guestData.extraIndications}
                                            onChange={(e) => setGuestData({ ...guestData, extraIndications: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Ej: Tocar el timbre del medio"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>"""

if old_datos in content:
    content = content.replace(old_datos, new_datos)
else:
    print("Warning: old_datos not found exactly! Checking alternative")

with open(filepath, 'w') as f:
    f.write(content)
print("Patch applied to page.tsx")
