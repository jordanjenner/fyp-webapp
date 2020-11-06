FROM python:3.7
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
WORKDIR /code
COPY requirements.txt /code/
RUN  echo -e '[DEFAULT]\n\
library_dirs = /usr/lib/openblas/lib\n\
include_dirs = /usr/lib/openblas/lib\n\n\
[atlas]\n\
atlas_libs = openblas\n\
libraries = openblas\n\n\
[openblas]\n\
libraries = openblas\n\
library_dirs = /usr/lib/openblas/lib\n\
include_dirs = /usr/lib/openblas/lib'  >> site.cfg 
RUN pip install -r requirements.txt
COPY . /code/
