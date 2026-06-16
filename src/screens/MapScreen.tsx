import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { useExploration } from '../hooks/useExploration';
import { useNearbyTrails } from '../hooks/useNearbyTrails';
import { subscribePois, Poi } from '../lib/db';
import { cellPolygon, explorePct } from '../lib/zones';

// Kartverket (norgeskart.no) raster tiles — open WMTS, web mercator.
const TOPO_LIGHT = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TOPO_DARK = 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png';
// National marked hiking-trail network (OSM-derived), overlaid on top.
const TRAILS_OVERLAY = 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png';

const BERGEN = { latitude: 60.39, longitude: 5.32, latitudeDelta: 0.18, longitudeDelta: 0.18 };
// Mainland Norway bounding box — the camera is clamped inside this.
const NO = { latMin: 57.5, latMax: 71.4, lngMin: 4.0, lngMax: 31.5 };
// Outer ring covers mainland Norway so revealed cells always fall inside it.
const NORWAY_BOX = [
  { latitude: 57.0, longitude: 3.5 },
  { latitude: 72.0, longitude: 3.5 },
  { latitude: 72.0, longitude: 32.0 },
  { latitude: 57.0, longitude: 32.0 },
];

export default function MapScreen({ navigation }: any) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const region = useRef<Region>(BERGEN);
  const { user } = useAuth();
  const { cells, status, position } = useExploration(user?.uid);

  const [pois, setPois] = useState<Poi[]>([]);
  useEffect(() => subscribePois(setPois), []);

  const [center, setCenter] = useState({ lat: BERGEN.latitude, lng: BERGEN.longitude });
  const { trails, loading: trailsLoading, error: trailsError } = useNearbyTrails(center.lat, center.lng);

  const baseTiles = isDark ? TOPO_DARK : TOPO_LIGHT;
  const holes = useMemo(() => cells.map((id) => cellPolygon(id)), [cells]);
  const fogColor = isDark ? 'rgba(8,6,5,0.82)' : 'rgba(34,28,23,0.5)';
  const pct = explorePct(cells.length).toFixed(1).replace('.', ',');

  const flyTo = (lat: number, lng: number) => {
    tap();
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
  };
  const recenter = () => {
    if (position) flyTo(position.latitude, position.longitude);
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
          // Clamp the camera to Norway so the map never leaves the country.
          const lat = Math.min(NO.latMax, Math.max(NO.latMin, r.latitude));
          const lng = Math.min(NO.lngMax, Math.max(NO.lngMin, r.longitude));
          region.current = { ...r, latitude: lat, longitude: lng };
          if (Math.abs(lat - r.latitude) > 0.001 || Math.abs(lng - r.longitude) > 0.001) {
            mapRef.current?.animateToRegion({ ...r, latitude: lat, longitude: lng }, 250);
          }
          setCenter({ lat, lng });
        }}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation={status === 'granted'}
        showsCompass={false}
      >
        {/* Real norgeskart.no base map (greyscale in dark mode). */}
        <UrlTile key={baseTiles} urlTemplate={baseTiles} maximumZ={18} zIndex={-2} tileSize={256} />
        {/* National marked hiking trails overlaid on top of the topo. */}
        <UrlTile urlTemplate={TRAILS_OVERLAY} maximumZ={18} zIndex={-1} tileSize={256} opacity={0.9} />
        {/* Fog of war: one dark polygon with a hole punched out per explored cell. */}
        <Polygon
          coordinates={NORWAY_BOX}
          holes={holes.length ? holes : undefined}
          fillColor={fogColor}
          strokeColor="transparent"
          strokeWidth={0}
        />
        {/* Subtle ember outline around the explored edge */}
        {holes.map((h, i) => (
          <Polygon key={i} coordinates={h} fillColor="rgba(255,107,26,0.06)" strokeColor="rgba(255,107,26,0.25)" strokeWidth={1} />
        ))}
        {pois.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name} description={`${p.diff} · ${p.dist}`}>
            <View style={[styles.pin, { backgroundColor: p.c1 }]}>
              <Ionicons name="triangle" size={13} color="#fff" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
          </Marker>
        ))}
      </MapView>

      <LinearGradient colors={[c.snow, 'transparent']} style={[styles.topGrad, { height: insets.top + 90 }]} pointerEvents="none" />
      <View style={[styles.head, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Text style={{ fontFamily: font.display, fontSize: 23, color: c.ink, letterSpacing: -0.5 }}>Ditt Norgeskart</Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: c.inkSoft, marginTop: 3 }}>{pct}% utforsket · {position ? 'live' : 'Bergen'}</Text>
      </View>

      <View style={[styles.stats, { top: insets.top + 58 }]} pointerEvents="none">
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{pct}%</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Utforsket</Text></Glass>
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{cells.length}</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Soner</Text></Glass>
        <Glass c={c}><Text style={[styles.statV, { color: c.ink }]}>{pois.length}</Text><Text style={[styles.statL, { color: c.inkSoft }]}>Steder</Text></Glass>
      </View>

      {/* recenter / location button */}
      <Pressable onPress={recenter} style={[styles.locBtn, { top: insets.top + 6, backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        <Ionicons name="locate" size={20} color={status === 'granted' ? c.ember : c.inkFaint} />
      </Pressable>

      {status === 'denied' && (
        <View style={[styles.permBanner, { top: insets.top + 110, backgroundColor: c.surface, borderColor: c.stoneLine }]}>
          <Ionicons name="location-outline" size={16} color={c.ember} />
          <Text style={{ flex: 1, fontSize: 12, color: c.inkSoft }}>Gi posisjonstilgang for å avdekke kartet mens du går.</Text>
        </View>
      )}

      <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.stoneLine, bottom: 100 }]}>
        <View style={[styles.handle, { backgroundColor: c.inkFaint }]} />
        <View style={styles.sheetHead}>
          <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>Turstier i nærheten</Text>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => { tap(); navigation.navigate('AddPlace', { center: { latitude: region.current.latitude, longitude: region.current.longitude } }); }}
          >
            <Ionicons name="add" size={14} color={c.ember} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: c.ember }}>Legg til</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
          {trailsLoading && trails.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 26 }}>
              <ActivityIndicator color={c.ember} />
              <Text style={{ color: c.inkSoft, marginTop: 8, fontSize: 12 }}>Henter turstier fra kartet …</Text>
            </View>
          )}
          {!trailsLoading && trailsError && (
            <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
              <Ionicons name="cloud-offline-outline" size={26} color={c.inkFaint} />
              <Text style={{ color: c.inkSoft, marginTop: 8, fontSize: 12.5, textAlign: 'center' }}>Kunne ikke hente turstier. Flytt kartet eller prøv igjen.</Text>
            </View>
          )}
          {!trailsLoading && !trailsError && trails.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
              <Ionicons name="trail-sign-outline" size={26} color={c.inkFaint} />
              <Text style={{ color: c.inkSoft, marginTop: 8, fontSize: 12.5, textAlign: 'center' }}>Ingen merkede turstier her. Flytt kartet til et turområde.</Text>
            </View>
          )}
          {trails.map((t) => (
            <Pressable key={t.id} onPress={() => flyTo(t.lat, t.lng)} style={styles.poi}>
              <Image source={t.image} style={{ width: 56, height: 56, borderRadius: 15, backgroundColor: c.stone }} contentFit="cover" transition={250} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.heading, fontSize: 14.5, color: c.ink }} numberOfLines={1}>{t.name}</Text>
                <Text style={{ fontSize: 11.5, color: c.inkSoft, marginTop: 3 }} numberOfLines={1}>{t.info}</Text>
                <Text style={{ fontSize: 11, color: c.ember, fontFamily: font.bodyBold, marginTop: 2 }}>{t.km.toString().replace('.', ',')} km unna</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Glass({ c, children }: any) {
  return (
    <View style={[styles.glass, { backgroundColor: c.isDark ? 'rgba(30,26,22,0.82)' : 'rgba(255,255,255,0.82)', borderColor: c.stoneLine }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.95 },
  head: { position: 'absolute', left: 22, right: 70 },
  stats: { position: 'absolute', left: 22, right: 22, flexDirection: 'row', gap: 9 },
  glass: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  statV: { fontFamily: font.display, fontSize: 17 },
  statL: { fontSize: 9.5, fontFamily: font.bodyBold, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  locBtn: { position: 'absolute', right: 22, width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  permBanner: { position: 'absolute', left: 22, right: 22, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  sheet: { position: 'absolute', left: 12, right: 12, borderRadius: 26, borderWidth: 1, padding: 10, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  handle: { width: 38, height: 4, borderRadius: 99, alignSelf: 'center', marginVertical: 6, opacity: 0.5 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 },
  poi: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 10, borderRadius: 16 },
  pin: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-45deg' }], shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
});
