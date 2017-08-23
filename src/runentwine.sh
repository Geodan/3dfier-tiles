#!/bin/bash

PGPARAM="port=5433 dbname=research user=postgres password="
BASEDIR="/var/data/git_repos/3dfier-tiles/"
PDAL="/usr/local/bin/pdal"
PDALOPT="$BASEDIR/conf/pdal_options.json"
WORKDIR="/var/data/tmp/tomt/pctiles/"

ENTWINECONF="../conf/entwine.json"
EXTENT="$1 $2 $3 $4"
let "MINX=$1"
let "MINY=$2"
let "MAXX=$3"
let "MAXY=$4"

TILENAME="$1-$2-$3-$4"
PDALEXT="PC_Intersects(pa,ST_MakeEnvelope($MINX,$MINY,$MAXX,$MAXY,28992))"
PDALOUT="$WORKDIR/pointcloud.las"
ENTWINEIN="$WORKDIR/pointcloud.las"
ENTWINEOUT="/tmp/pctiles"

$PDAL pipeline --readers.pgpointcloud.where="$PDALEXT" --writers.las.filename="$PDALOUT" $PDALOPT
echo "PDAL output:"
echo $PDALOUTPUT
rm -r /tmp/pctiles
echo "Running entwine"
entwine build $ENTWINECONF -i $ENTWINEIN -o $ENTWINEOUT
