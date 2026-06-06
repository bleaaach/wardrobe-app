import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";

export default function AddClothingScreen() {
  const router = useRouter();
  const categories = useClothingStore((s) => s.categories);
  const addItem = useClothingStore((s) => s.addItem);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("需要相机权限"); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!image) { Alert.alert("请先拍照或选择图片"); return; }
    await addItem({ categoryId, name, imageUri: image, brand, color, season, notes });
    router.back();
  };

  const colors = ["红", "橙", "黄", "绿", "蓝", "紫", "黑", "白", "灰", "棕", "粉"];
  const seasons = ["春", "夏", "秋", "冬"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Picker */}
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#d1d5db" />
            <Text style={styles.imageText}>点击拍照或选择图片</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.imageActions}>
        <Pressable style={styles.camBtn} onPress={takePhoto}><Ionicons name="camera" size={20} color="#6366f1" /><Text style={styles.camBtnText}>拍照</Text></Pressable>
        <Pressable style={styles.camBtn} onPress={pickImage}><Ionicons name="images" size={20} color="#6366f1" /><Text style={styles.camBtnText}>相册</Text></Pressable>
      </View>

      {/* Name */}
      <Text style={styles.label}>名称</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="如：白色T恤" />

      {/* Category */}
      <Text style={styles.label}>分类</Text>
      <View style={styles.chips}>
        {categories.map((cat) => (
          <Pressable key={cat.id} style={[styles.chip, categoryId === cat.id && styles.chipActive]} onPress={() => setCategoryId(cat.id)}>
            <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.icon} {cat.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Brand */}
      <Text style={styles.label}>品牌</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="如：优衣库" />

      {/* Color */}
      <Text style={styles.label}>颜色</Text>
      <View style={styles.chips}>
        {colors.map((c) => (
          <Pressable key={c} style={[styles.chip, color === c && styles.chipActive]} onPress={() => setColor(c === color ? "" : c)}>
            <Text style={[styles.chipText, color === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {/* Season */}
      <Text style={styles.label}>季节</Text>
      <View style={styles.chips}>
        {seasons.map((s) => (
          <Pressable key={s} style={[styles.chip, season === s && styles.chipActive]} onPress={() => setSeason(s === season ? "" : s)}>
            <Text style={[styles.chipText, season === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>备注</Text>
      <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="备注信息..." multiline />

      {/* Save */}
      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>保存</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, paddingBottom: 40 },
  imagePicker: { width: "100%", height: 280, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageText: { color: "#9ca3af", marginTop: 8 },
  imageActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  camBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 12, backgroundColor: "#fff" },
  camBtnText: { color: "#6366f1", fontSize: 14 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 12, fontSize: 15 },
  notesInput: { height: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#6366f1" },
  chipText: { fontSize: 13, color: "#6b7280" },
  chipTextActive: { color: "#fff" },
  saveBtn: { backgroundColor: "#6366f1", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
