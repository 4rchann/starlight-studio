const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

export async function requestGeolocation() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported')
        return null
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            },
            (error) => {
                console.warn('Geolocation error:', error.message)
                resolve(null)
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }
        )
    })
}


export async function extractExifLocation(file) {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const dataView = new DataView(arrayBuffer)

        if (dataView.getUint16(0) !== 0xFFD8) {
            return null
        }

        let offset = 2
        while (offset < dataView.byteLength) {
            const marker = dataView.getUint16(offset)
            
            if (marker === 0xFFE1) {
                const exifData = parseExifGPS(dataView, offset + 4)
                if (exifData) return exifData
            }
            
            if (marker === 0xFFD9 || marker === 0xFFDA) break
            const length = dataView.getUint16(offset + 2)
            offset += 2 + length
        }

        return null
    } catch (error) {
        console.warn('EXIF extraction failed:', error)
        return null
    }
}

function parseExifGPS(dataView, start) {
    try {
        const exifHeader = String.fromCharCode(
            dataView.getUint8(start),
            dataView.getUint8(start + 1),
            dataView.getUint8(start + 2),
            dataView.getUint8(start + 3)
        )
        
        if (exifHeader !== 'Exif') return null

        const tiffStart = start + 6
        const littleEndian = dataView.getUint16(tiffStart) === 0x4949

        const ifdOffset = dataView.getUint32(tiffStart + 4, littleEndian)
        const entries = dataView.getUint16(tiffStart + ifdOffset, littleEndian)

        let gpsOffset = null
        for (let i = 0; i < entries; i++) {
            const entryOffset = tiffStart + ifdOffset + 2 + (i * 12)
            const tag = dataView.getUint16(entryOffset, littleEndian)
            
            if (tag === 0x8825) {
                gpsOffset = dataView.getUint32(entryOffset + 8, littleEndian)
                break
            }
        }

        if (!gpsOffset) return null

        const gpsEntries = dataView.getUint16(tiffStart + gpsOffset, littleEndian)
        let lat = null, lng = null, latRef = 'N', lngRef = 'E'

        for (let i = 0; i < gpsEntries; i++) {
            const entryOffset = tiffStart + gpsOffset + 2 + (i * 12)
            const tag = dataView.getUint16(entryOffset, littleEndian)
            const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian)

            switch (tag) {
                case 1:
                    latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8))
                    break
                case 2: 
                    lat = readGPSCoordinate(dataView, tiffStart + valueOffset, littleEndian)
                    break
                case 3: 
                    lngRef = String.fromCharCode(dataView.getUint8(entryOffset + 8))
                    break
                case 4: 
                    lng = readGPSCoordinate(dataView, tiffStart + valueOffset, littleEndian)
                    break
            }
        }

        if (lat !== null && lng !== null) {
            return {
                lat: latRef === 'S' ? -lat : lat,
                lng: lngRef === 'W' ? -lng : lng
            }
        }

        return null
    } catch (error) {
        return null
    }
}

function readGPSCoordinate(dataView, offset, littleEndian) {
    const degrees = dataView.getUint32(offset, littleEndian) / dataView.getUint32(offset + 4, littleEndian)
    const minutes = dataView.getUint32(offset + 8, littleEndian) / dataView.getUint32(offset + 12, littleEndian)
    const seconds = dataView.getUint32(offset + 16, littleEndian) / dataView.getUint32(offset + 20, littleEndian)
    
    return degrees + minutes / 60 + seconds / 3600
}

export async function reverseGeocode(lat, lng) {
    try {
        const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&zoom=10`
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'StarlightStudio/1.0'
            }
        })

        if (!response.ok) return null

        const data = await response.json()
        
        if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county
            const country = data.address.country

            if (city && country) {
                return `${city}, ${country}`
            } else if (city) {
                return city
            } else if (country) {
                return country
            }
        }

        return null
    } catch (error) {
        console.warn('Reverse geocoding failed:', error)
        return null
    }
}

export async function getLocationString(lat, lng) {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
    
    if (locationCache.has(cacheKey)) {
        return locationCache.get(cacheKey)
    }

    const location = await reverseGeocode(lat, lng)
    
    if (location) {
        locationCache.set(cacheKey, location)
    }

    return location
}

const locationCache = new Map()
