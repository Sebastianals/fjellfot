import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, Polyline, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { useExploration } from '../hooks/useExploration';
import { useGeonorgeTrails, RouteTrail } from '../hooks/useGeonorgeTrails';
import { subscribePois, Poi } from '../lib/db';
import { cellPolygon, explorePct } from '../lib/zones';

const TOPO_LIGHT = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TOPO_DARK = 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png';
const BERGEN = { latitude: 60.39, longitude: 5.32, latitudeDelta: 0.12, longitudeDelta: 0.12 };
const NO = { latMin: 57.5, latMax: 71.4, lngMin: 4.0, lngMax: 31.5 };

const distKm = (a: any, b: any) => {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.latitude - a.latitude), dLng = r(b.longitude - a.longitude);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

export default function MapScreen({ navigation }: any) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(BERGEN);
  const { user } = useAuth();
  const { cells, status, position } = useExploration(user?.uid);
  const { trails, loading, error, zoomedIn } = useGeonorgeTrails(region);

  const [pois, setPois] = useState<Poi[]>([]);
  useEffect(() => subscribePois(setPois), []);

  const baseTiles = isDark ? TOPO_DARK : TOPO_LIGHT;
  const holes = useMemo(() => cells.map((id) => cellPolygon(id)), [cells]);
  const fogColor = isDark ? 'rgba(8,6,5,0.78)' : 'rgba(34,28,23,0.42)';
  const pct = explorePct(cells.length).toFixed(1).replace('.', ',');

  const sorted = useMemo(
    () => [...trails].map((t) => ({ ...t, away: distKm(region, t.mid) })).sort((a, b) => a.away - b.away),
    [trails, region.latitude, region.longitude],
  );

  const flyTo = (lat: number, lng: number, d = 0.04) => {
    tap();
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: d, longitudeDelta: d }, 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.mapBase }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={BERGEN}
        minZoomLevel={4}
        rotateEnabled={false}
        pitchEnabled={false}
        onRegionChangeComplete={(r) => {
          const lat = Math.min(NO.latMax, Math.max(NO.latMin, r.latitude));
          const lng = Math.min(NO.lngMax, Math.max(NO.lngMin, r.longitude));
          if (Math.abs(lat - r.latitude) > 0.001 || Math.abs(lng - r.longitude) > 0.001) {
            mapRef.current?.animateToRegion({ ...r, latitude: lat, longitude: lng }, 250);
          }
          setRegion({ ...r, latitude: lat, longitude: lng });
        }}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation={status === 'granted'}
        showsCompass={false}
      >
        <UrlTile key={baseTiles} urlTemplate={baseTiles} maximumZ={18} zIndex={-2} tileSize={256} />

        {/* Official trail routes (Kartverket Tur- og friluftsruter) drawn as lines. */}
        {trails.map((t) => (
          <Polyline key={t.id} coordinates={t.coords} strokeColor="#E2480A" strokeWidth={4} lineCap="round" lineJoin="round" />
        ))}
        {trails.map((t) => (
          <Marker key={'m' + t.id} coordinate={t.mid} title={t.name} description={`Tursti · ${t.km.toString().replace('.', ',')} km`} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.trailDot}><Ionicons name="walk" size={13} color="#fff" /></View>
          </Marker>
        ))}

        {/* Fog of war */}
        <Polygon coordinates={[{ latitude: NO.latMin, longitude: NO.lngMin }, { latitude: NO.latMax, longitude: NO.lngMin }, { latitude: NO.latMax, longitude: NO.lngMax }, { latitude: NO.latMin, longitude: NO.lngMax }]} holes={holes.length ? holes : undefined} fillColor={fogColor} strokeColor="transparent" strokeWidth={0} />

        {/* User-added places */}
        {pois.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name} description={p.diff}>
            <View style={[styles.pin, { backgroundColor: p.c1 }]}><Ionicons name="triangle" size={13} color="#fff" style={{ transform: [{ rotate: '45deg' }] }} /></View>
          </Marker>
        ))}
      </MapView>

      <LinearGradient colors={[c.snow, 'transparent']} style={[styles.topGrad, { height: insets.top + 90 }]} pointerEvents="none" />
      <View style={[styles.head, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Text style={{ fontFamily: font.display, fontSize: 23, color: c.ink, letterSpacing: -0.5 }}>Ditt Norgeskart</Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: c.inkSoft, marginTop: 3 }}>{pct}% utforsket{position ? ' · live' : ''}</Text>
      </View>

      <View style={[styles.stats, { top: insets.top + 58 }]} pointerEvents="none">
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{pct}%</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Utforsket</Text></Glass>
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{cells.length}</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Soner</Text></Glass>
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{zoomedIn ? trails.length : '—'}</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Turstier</Text></Glass>
      </View>

      <Pressable onPress={() => position && flyTo(position.latitude, position.longitude)} style={[styles.locBtn, { top: insets.top + 6, backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        <Ionicons name="locate" size={20} color={status === 'granted' ? c.ember : c.inkFaint} />
      </Pressable>

      <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.stoneLine, bottom: 100 }]}>
        <View style={[styles.handle, { backgroundColor: c.inkFaint }]} />
        <View style={styles.sheetHead}>
          <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>Turstier i området</Text>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => { tap(); navigation.navigate('AddPlace', { center: { latitude: region.latitude, longitude: region.longitude } }); }}>
            <Ionicons name="add" size={14} color={c.ember} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: c.ember }}>Legg til</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
          {!zoomedIn && (
            <Empty c={c} icon="search" text="Zoom inn på kartet for å se offisielle turstier i området." />
          )}
          {zoomedIn && loading && trails.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 26 }}>
              <ActivityIndicator color={c.ember} />
              <Text style={{ color: c.inkSoft, marginTop: 8, fontSize: 12 }}>Henter turstier fra Kartverket …</Text>
            </View>
          )}
          {zoomedIn && !loading && error && (
            <Empty c={c} icon="cloud-offline-outline" text="Kunne ikke hente turstier akkurat nå. Flytt kartet for å prøve igjen." />
          )}
          {zoomedIn && !loading && !error && trails.length === 0 && (
            <Empty c={c} icon="trail-sign-outline" text="Ingen merkede turstier i dette området." />
          )}
          {sorted.map((t) => (
            <Pressable key={t.id} onPress={() => flyTo(t.mid.latitude, t.mid.longitude)} style={styles.poi}>
              <Image source={t.image} style={{ width: 56, height: 56, borderRadius: 15, backgroundColor: c.stone }} contentFit="cover" transition={250} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.heading, fontSize: 14.5, color: c.ink }} numberOfLines={1}>{t.name}</Text>
                <Text style={{ fontSize: 11.5, color: c.inkSoft, marginTop: 3 }}>Tursti · {t.km.toString().replace('.', ',')} km lang</Text>
                <Text style={{ fontSize: 11, color: c.ember, fontFamily: font.bodyBold, marginTop: 2 }}>{t.away.toFixed(1).replace('.', ',')} km unna</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Empty({ c, icon, text }: any) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
      <Ionicons name={icon} size={26} color={c.inkFaint} />
      <Text style={{ color: c.inkSoft, marginTop: 8, fontSize: 12.5, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

function Glass({ c, children }: any) {
  return <View style={[styles.glass, { backgroundColor: c.isDark ? 'rgba(30,26,22,0.85)' : 'rgba(255,255,255,0.85)', borderColor: c.stoneLine }]}>{children}</View>;
}

const styles = StyleSheet.create({
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.95 },
  head: { position: 'absolute', left: 22, right: 70 },
  stats: { position: 'absolute', left: 22, right: 22, flexDirection: 'row', gap: 9 },
  glass: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  statV: { fontFamily: font.display, fontSize: 17 },
  statL: { fontSize: 9.5, fontFamily: font.bodyBold, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  locBtn: { position: 'absolute', right: 22, width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  sheet: { position: 'absolute', left: 12, right: 12, borderRadius: 26, borderWidth: 1, padding: 10, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  handle: { width: 38, height: 4, borderRadius: 99, alignSelf: 'center', marginVertical: 6, opacity: 0.5 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 },
  poi: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 10, borderRadius: 16 },
  pin: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-45deg' }], shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  trailDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E2480A', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
});
