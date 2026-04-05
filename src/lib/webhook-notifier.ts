/**
 * Webhook Notification System
 * Send scan results to Discord/Slack
 */

interface ScanResult {
  id: string;
  riskScore: number;
  rating: string;
  summary: string;
  detections: Array<{
    name: string;
    detections: Array<{
      title: string;
      severity: string;
    }>;
  }>;
  fileMetadata: {
    filename?: string;
    size: number;
  };
}

export class WebhookNotifier {
  /**
   * Send scan result to Discord webhook
   */
  static async sendToDiscord(
    webhookUrl: string,
    result: ScanResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const color = this.getColorForScore(result.riskScore);
      
      const embed = {
        title: `Luma Scan Result - ${result.rating}`,
        description: result.summary,
        color: color,
        fields: [
          {
            name: 'Risk Score',
            value: `${result.riskScore}/100`,
            inline: true,
          },
          {
            name: 'File',
            value: result.fileMetadata.filename || 'Pasted Code',
            inline: true,
          },
          {
            name: 'Size',
            value: `${(result.fileMetadata.size / 1024).toFixed(1)} KB`,
            inline: true,
          },
          {
            name: 'Findings',
            value: result.detections.map(d => 
              `${d.name}: ${d.detections.length} issue(s)`
            ).join('\n') || 'No issues found',
          },
        ],
        footer: {
          text: `Scan ID: ${result.id}`,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Luma Scanner',
          avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
          embeds: [embed],
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Discord API error: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send scan result to Slack webhook
   */
  static async sendToSlack(
    webhookUrl: string,
    result: ScanResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const color = this.getColorForScore(result.riskScore);
      const colorEmoji = this.getEmojiForScore(result.riskScore);

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${colorEmoji} Luma Scan Result - ${result.rating}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: result.summary,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Risk Score:*\n${result.riskScore}/100`,
            },
            {
              type: 'mrkdwn',
              text: `*File:*\n${result.fileMetadata.filename || 'Pasted Code'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Size:*\n${(result.fileMetadata.size / 1024).toFixed(1)} KB`,
            },
            {
              type: 'mrkdwn',
              text: `*Issues:*\n${result.detections.reduce((acc, d) => acc + d.detections.length, 0)}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Scan ID: \`${result.id}\``,
            },
          ],
        },
      ];

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Slack API error: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static getColorForScore(score: number): number {
    if (score <= 20) return 0x22c55e;      // Green
    if (score <= 40) return 0xf59e0b;      // Yellow
    if (score <= 60) return 0xf97316;      // Orange
    if (score <= 80) return 0xef4444;      // Red
    return 0xdc2626;                        // Dark Red
  }

  private static getEmojiForScore(score: number): string {
    if (score <= 20) return ':white_check_mark:';
    if (score <= 40) return ':warning:';
    if (score <= 60) return ':x:';
    return ':no_entry:';
  }
}
