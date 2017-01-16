#!/bin/bash

PGPARAM="dbname=research user=postgres password="
BASEDIR="/var/data/git_repos/3dfier-tiles/"
MODELDIR="$BASEDIR/data/models"
OGR2OGR="/usr/local/bin/ogr2ogr"
PDAL="/usr/local/bin/pdal"
PDALOPT="$BASEDIR/conf/pdal_options.json"
THREEDFIER="/home/tomt/src/3dfier-master/build/3dfier"
THREEDCONF="$BASEDIR/conf/3dfier.yml"

EXTENT="$1 $2 $3 $4"
if ! [[ $EXTENT =~ ^[0-9]+[[:space:]][0-9]+[[:space:]][0-9]+[[:space:]][0-9]+$ ]]; then
	echo "no valid extent"
	exit 1
fi
TILENAME="$1-$2-$3-$4"
WORKDIR="/tmp/$TILENAME"
if ! [[ -e $WORKDIR ]]; then
	mkdir -p $WORKDIR
fi
if ! [[ -e $MODELDIR ]]; then
	mkdir -p $MODELDIR
fi

let "MINX=$1-50"
let "MINY=$2-50"
let "MAXX=$3+50"
let "MAXY=$4+50"

PDALEXT="PC_Intersects(pa,ST_MakeEnvelope($MINX,$MINY,$MAXX,$MAXY,28992))"
PDALOUT="$WORKDIR/pointcloud.las"
echo -n "Extracting pointcloud..."
$PDAL pipeline --readers.pgpointcloud.where="$PDALEXT" --writers.las.filename="$PDALOUT" $PDALOPT
echo "done"

cd $WORKDIR

EXTENTBUF="$MINX $MINY $MAXX $MAXY"
echo -n "Writing BGT files..."
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -f sqlite bgt_pand.sqlite PG:"${PGPARAM}" bgt.pand_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -f sqlite bgt_overigbouwwerk.sqlite PG:"${PGPARAM}" bgt.overigbouwwerk_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_ondersteunendwegdeel.sqlite PG:"${PGPARAM}" bgt.ondersteunendwegdeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_overbruggingsdeel.sqlite PG:"${PGPARAM}" bgt.overbruggingsdeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_onbegroeidterreindeel.sqlite PG:"${PGPARAM}" bgt.onbegroeidterreindeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_ondersteunendwaterdeel.sqlite PG:"${PGPARAM}" bgt.ondersteunendwaterdeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_begroeidterreindeel.sqlite PG:"${PGPARAM}" bgt.begroeidterreindeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_scheiding.sqlite PG:"${PGPARAM}" bgt.scheiding_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_wegdeel.sqlite PG:"${PGPARAM}" bgt.wegdeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_waterdeel.sqlite PG:"${PGPARAM}" bgt.waterdeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_tunneldeel.sqlite PG:"${PGPARAM}" bgt.tunneldeel_2d
$OGR2OGR -nlt CONVERT_TO_LINEAR -where "eindregistratie is NULL" -spat $EXTENT -clipdst $EXTENTBUF \
	-f sqlite bgt_kunstwerkdeel.sqlite PG:"${PGPARAM}" bgt.kunstwerkdeel_2d
echo "done"

echo -n "Running 3dfier..."
$THREEDFIER $THREEDCONF > $MODELDIR/$TILENAME.obj
echo "done"

#EXTENT="121000 486600 122000 487400" # centrum_small.laz 
#EXTENT="119200 482900 120000 483600" # zuidas.laz 
#EXTENT="121000 486000 123000 488000" # centrum.laz
#EXTENT="120000 481250 125000 487500" # c_25gn1.laz
