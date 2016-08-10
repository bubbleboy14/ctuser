from setuptools import setup

setup(
    name='ctuser',
    version="0.1",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='User plugin for cantools (ct)',
    long_description='This package includes a model and request handler for handling user accounts.',
    packages=[
        'ctuser'
    ],
    zip_safe = False,
    install_requires = [
        "ct >= 0.8.4.3"
    ],
    entry_points = '''''',
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],
)
