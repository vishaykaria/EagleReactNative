import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface FormData {
  formType: string;
  accountName: string;
  userData: any;
}

export class DocumentExportService {
  static async exportIRSForm(formData: FormData): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.exportForWeb(formData);
      } else {
        await this.exportForMobile(formData);
      }
    } catch (error) {
      console.error('Document export error:', error);
      Alert.alert('Export Failed', 'There was an error exporting the document. Please try again.');
    }
  }

  private static async exportForWeb(formData: FormData): Promise<void> {
    // Web implementation - create and download file
    const documentContent = this.generateDocumentContent(formData);
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.formType}_${formData.accountName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Alert.alert('Success', 'Document has been downloaded to your Downloads folder.');
  }

  private static async exportForMobile(formData: FormData): Promise<void> {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }

    // Generate document content
    const documentContent = this.generateDocumentContent(formData);
    
    // Create file in document directory
    const fileName = `${formData.formType}_${formData.accountName}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, documentContent);
    
    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: `Export ${formData.formType}`,
    });
    
    Alert.alert('Success', 'Document has been exported and shared.');
  }

  private static generateDocumentContent(formData: FormData): string {
    // This would generate the actual IRS form content
    // For now, return a placeholder
    return `
IRS ${formData.formType.toUpperCase()} - ${formData.accountName}
Generated on: ${new Date().toLocaleDateString()}

This is a placeholder for the actual IRS form content.
In a production app, this would contain:
- Formatted tax form data
- Account information
- Transaction details
- Tax calculations

Form Type: ${formData.formType}
Account: ${formData.accountName}
Export Date: ${new Date().toISOString()}
    `.trim();
  }
}