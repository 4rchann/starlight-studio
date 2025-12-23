export const PHOTOSTRIPS = [
    {
        id: 'default-6x2-2',
        name: 'Default',
        layoutId: 'layout-6x2-2',
        preview: './assets/preview/preview6x2-2pose.png',
        stripImage: null,
        slots: null
    },
    {
        id: 'default-6x2-4',
        name: 'Default',
        layoutId: 'layout-6x2-4',
        preview: './assets/preview/preview6x2-4pose.png',
        stripImage: null,
        slots: null
    },
    {
        id: 'default-6x4-1',
        name: 'Default',
        layoutId: 'layout-6x4-1',
        preview: './assets/preview/preview6x4-1pose.png',
        stripImage: null,
        slots: null
    },
    {
        id: 'default-6x4-2',
        name: 'Default',
        layoutId: 'layout-6x4-2',
        preview: './assets/preview/preview6x4-2pose.png',
        stripImage: null,
        slots: null
    },
    {
        id: 'default-6x4-4',
        name: 'Default',
        layoutId: 'layout-6x4-4',
        preview: './assets/preview/preview6x4-4pose.png',
        stripImage: null,
        slots: null
    },
    {
        id: 'default-6x4-6',
        name: 'Default',
        layoutId: 'layout-6x4-6',
        preview: './assets/preview/preview6x4-6pose.png',
        stripImage: null,
        slots: null
    },

    {
        id: 'kodak-6x4-4',
        name: 'Kodak',
        layoutId: 'layout-6x4-4',
        preview: './assets/preview/kodakpreview6x4-4pose.png',
        stripImage: './assets/photostrips/kodak6x4-4pose.png',
        slots: [
            { x: 49, y: 85, width: 532, height: 708},
            { x: 620, y: 85, width: 532, height: 708},
            { x: 49, y: 958, width: 532, height: 708},
            { x: 620, y: 958, width: 532, height: 708}
        ]
    },
    {
        id: 'kodak-6x4-1',
        name: 'Kodak Film',
        layoutId: 'layout-6x4-1',
        preview: './assets/preview/kodakpreview6x4-1pose.png',
        stripImage: './assets/photostrips/kodak6x4-1pose.png',
        slots: [
            { x: 158, y: 167, width: 955, height: 1515}
        ]
    }
]

export function getPhotostripsForLayout(layoutId) {
    return PHOTOSTRIPS.filter(strip => strip.layoutId === layoutId)
}