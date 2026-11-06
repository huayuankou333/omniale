import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import ConvexHull

INTER_AREA = 3


def connectedComponentsWithStats(mask):
    labels, count = ndimage.label(mask, structure=np.ones((3, 3)))
    slices = ndimage.find_objects(labels)
    stats = np.zeros((count + 1, 5), dtype=np.int32)
    centers = np.zeros((count + 1, 2), dtype=float)
    for index, bounds in enumerate(slices, 1):
        if bounds is None:
            continue
        rows, columns = bounds
        component = labels[bounds] == index
        points = np.argwhere(component)
        stats[index] = [columns.start, rows.start, columns.stop - columns.start, rows.stop - rows.start, len(points)]
        centers[index] = points.mean(0)[::-1] + [columns.start, rows.start]
    return count + 1, labels, stats, centers


def convexHull(points):
    points = np.asarray(points).reshape(-1, 2)
    points = np.unique(points, axis=0)
    if len(points) < 3:
        return points.reshape(-1, 1, 2)
    try:
        return points[ConvexHull(points).vertices].reshape(-1, 1, 2)
    except Exception:
        return points.reshape(-1, 1, 2)


def fillConvexPoly(mask, polygon, color):
    image = Image.fromarray(mask)
    points = [tuple(map(int, point)) for point in np.asarray(polygon).reshape(-1, 2)]
    if len(points) > 2:
        ImageDraw.Draw(image).polygon(points, fill=int(color))
    mask[:] = np.asarray(image)


def resize(mask, dimensions, interpolation=INTER_AREA):
    return np.asarray(Image.fromarray(mask).resize(dimensions, Image.Resampling.BOX))


def dilate(mask, kernel):
    return ndimage.maximum_filter(mask, size=kernel.shape, mode='constant', cval=0)
