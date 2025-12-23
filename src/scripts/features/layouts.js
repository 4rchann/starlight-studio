export const LAYOUTS = [
    {
        id: 'layout-6x2-2',
        name: '6x2 Strip (2 Pose)',
        type: 'strip',
        width: 600,
        height: 1800,
        photoCount: 2,
        preview: './assets/preview/defaultpreview6x2-2pose.png',
        slots: [
            { x: 50, y: 50, width: 500, height: 750 },
            { x: 50, y: 850, width: 500, height: 750}
        ],
        text: { x: 300, y: 1700, fontSize: 32, color: '#000000', text: 'Starlight Studio'}
    },
    {
        id: 'layout-6x2-4',
        name: '6x2 Strip (4 Pose)',
        type: 'strip',
        width: 600,
        height: 1800,
        photoCount: 4,
        preview: './assets/preview/defaultpreview6x2-4pose.png',
        slots: [
            { x: 50, y: 50, width: 500, height: 375},
            { x: 50, y: 450, width: 500, height: 375},
            { x: 50, y: 850, width: 500, height: 375},
            { x: 50, y: 1250, width: 500, height: 375}
        ],
        text: { x: 300, y: 1700, fontSize: 32, color: '#000000', text: 'Starlight Studio'}
    },
    {
        id: 'layout-6x4-1',
        name: '6x4 Postcard (1 Pose)',
        type: 'postcard',
        width: 1200,
        height: 1800,
        photoCount: 1,
        preview: './assets/preview/defaultpreview6x4-1pose.png',
        slots: [
            { x: 100, y: 100, width: 1000, height: 1400}
        ],
        text: { x: 600, y: 1600, fontSize: 40, color: '#000000', text: 'Starlight Studio'},
        lockBranding: true
    },
    {
        id: 'layout-6x4-2',
        name: '6x4 Postcard (2 Pose)',
        type: 'postcard',
        width: 1200,
        height: 1800,
        photoCount: 2,
        preview: './assets/preview/defaultpreview6x4-2pose.png',
        slots: [
            { x: 100, y: 100, width: 1000, height: 700},
            { x: 100, y: 850, width: 1000, height: 700}
        ],
        text: { x: 600, y: 1600, fontSize: 40, color: '#000000', text: 'Starlight Studio'},
        lockBranding: true
    },
    {
        id: 'layout-6x4-4',
        name: '6x4 Postcard (4 Pose)',
        type: 'postcard',
        width: 1200,
        height: 1800,
        photoCount: 4,
        preview: './assets/preview/defaultpreview6x4-4pose.png',
        slots: [
            { x: 50, y: 50, width: 525, height: 700},
            { x: 625, y: 50, width: 525, height: 700},
            { x: 50, y: 800, width: 525, height: 700},
            { x: 625, y: 800, width: 525, height: 700}
        ],
        text: { x: 600, y: 1600, fontSize: 40, color: '#000000', text: 'Starlight Studio'},
        lockBranding: true
    },
    {
        id: 'layout-6x4-6',
        name: '6x4 Postcard (6 Pose)',
        type: 'postcard',
        width: 1200,
        height: 1800,
        photoCount: 6,
        preview: './assets/preview/defaultpreview6x4-6pose.png',
        slots: [
            { x: 50, y: 50, width: 500, height: 450},
            { x: 650, y: 50, width: 500, height: 450},
            { x: 50, y: 550, width: 500, height: 450},
            { x: 650, y: 550, width: 500, height: 450},
            { x: 50, y: 1050, width: 500, height: 450},
            { x: 650, y: 1050, width: 500, height: 450}
        ],
        text: { x: 600, y: 1600, fontSize: 40, color: '#000000', text: 'Starlight Studio'},
        lockBranding: true
    }
]

export function getLayoutById(id) {
    return LAYOUTS.find(layout => layout.id === id)
}