
# How to install the renderer?

Let's talk about this a bit.

## Something

Don't forget to do the following bash export:

```bash
export OSMESA_LIBRARY=/usr/lib/x86_64-linux-gnu/libOSMesa.so
export VISPY_GL_LIB=/usr/lib/x86_64-linux-gnu/libOSMesa.so
```

Also make the changes in `__init__.py` of *napari*

## Packages to install

* In order to process `.czi` files:

```bash
pip install aicsimageio
```
